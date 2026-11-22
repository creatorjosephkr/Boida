import Foundation
import ReplayKit
import VideoToolbox
import UIKit
import Combine

class ScreenStreamer: ObservableObject {
    @Published var isStreaming = false
    @Published var connectionStatus = "Disconnected"
    @Published var fps: Int = 0
    @Published var sentBytesPerSecond: Double = 0.0
    
    private var webSocketTask: URLSessionWebSocketTask?
    private let urlSession = URLSession(configuration: .default)
    
    // Reusable GPU Metal CIContext (reused across all frames to prevent OOM crashes)
    private let ciContext = CIContext(options: [CIContextOption.useSoftwareRenderer: false])
    
    // Configurable parameters
    var serverIP: String = ""
    var serverPort: String = "3000"
    var scaleFactor: CGFloat = 0.6 // Scale screen resolution down (e.g. 720p level) to save bandwidth
    var compressionQuality: CGFloat = 0.85 // JPEG compression level (high color fidelity)
    var maxFPS: Double = 30.0 // Target frame rate
    
    private var lastFrameTime: Date = Date()
    private var frameCount = 0
    private var bytesSent = 0
    private let metricsLock = NSLock()
    private var fpsTimer: Timer?
    private var isConnecting = false
    
    init() {
        startMetricsTimer()
    }
    
    func connect() {
        guard !serverIP.isEmpty else {
            self.connectionStatus = "IP Required"
            return
        }
        
        guard let url = URL(string: "ws://\(serverIP):\(serverPort)/ws?type=sender") else {
            self.connectionStatus = "Invalid URL"
            return
        }
        
        isConnecting = true
        connectionStatus = "Connecting..."
        
        let request = URLRequest(url: url)
        webSocketTask = urlSession.webSocketTask(with: request)
        webSocketTask?.resume()
        
        listenForPing()
    }
    
    private func listenForPing() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    print("Received server message: \(text)")
                case .data(_):
                    break
                @unknown default:
                    break
                }
                self.listenForPing()
            case .failure(let error):
                print("WebSocket connection failed: \(error)")
                DispatchQueue.main.async {
                    self.disconnect()
                    self.connectionStatus = "Connection Failed"
                }
            }
        }
        
        // Verify connection with WebSocket ping
        webSocketTask?.sendPing { [weak self] error in
            DispatchQueue.main.async {
                guard let self = self else { return }
                self.isConnecting = false
                if let error = error {
                    print("WebSocket ping error: \(error)")
                    self.connectionStatus = "Connection Failed"
                } else {
                    self.connectionStatus = "Connected"
                }
            }
        }
    }
    
    func disconnect() {
        stopStreaming()
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        DispatchQueue.main.async {
            self.connectionStatus = "Disconnected"
        }
    }
    
    func startStreaming() {
        guard connectionStatus == "Connected" else {
            connect()
            // Wait brief moment and try streaming if connection succeeded
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
                guard let self = self else { return }
                if self.connectionStatus == "Connected" {
                    self.startScreenCapture()
                }
            }
            return
        }
        startScreenCapture()
    }
    
    private func startScreenCapture() {
        let recorder = RPScreenRecorder.shared()
        guard recorder.isAvailable else {
            DispatchQueue.main.async {
                self.connectionStatus = "Screen Capture Unavailable"
            }
            return
        }
        
        recorder.startCapture(handler: { [weak self] (sampleBuffer, bufferType, error) in
            guard let self = self else { return }
            
            if let error = error {
                print("Error capturing screen: \(error)")
                return
            }
            
            if bufferType == .video {
                self.processVideoFrame(sampleBuffer)
            }
        }) { [weak self] error in
            guard let self = self else { return }
            DispatchQueue.main.async {
                if let error = error {
                    print("Failed to start capture: \(error)")
                    self.isStreaming = false
                } else {
                    self.isStreaming = true
                    self.connectionStatus = "Streaming Live"
                }
            }
        }
    }
    
    func stopStreaming() {
        let recorder = RPScreenRecorder.shared()
        if recorder.isRecording {
            recorder.stopCapture { [weak self] error in
                if let error = error {
                    print("Error stopping capture: \(error)")
                }
                DispatchQueue.main.async {
                    guard let self = self else { return }
                    self.isStreaming = false
                    if self.connectionStatus == "Streaming Live" {
                        self.connectionStatus = "Connected"
                    }
                }
            }
        } else {
            DispatchQueue.main.async {
                self.isStreaming = false
                if self.connectionStatus == "Streaming Live" {
                    self.connectionStatus = "Connected"
                }
            }
        }
    }
    
    private func processVideoFrame(_ sampleBuffer: CMSampleBuffer) {
        // Frame throttling
        let now = Date()
        let interval = 1.0 / maxFPS
        guard now.timeIntervalSince(lastFrameTime) >= interval else {
            return
        }
        lastFrameTime = now
        
        guard let imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        
        // Lock the base address of the pixel buffer
        CVPixelBufferLockBaseAddress(imageBuffer, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(imageBuffer, .readOnly) }
        
        var ciImage = CIImage(cvPixelBuffer: imageBuffer)
        
        // GPU-accelerated scaling via CoreImage
        if scaleFactor < 0.99 {
            ciImage = ciImage.transformed(by: CGAffineTransform(scaleX: scaleFactor, y: scaleFactor))
        }
        
        // Render scaled image on GPU using cached CIContext (zero memory allocations)
        guard let cgImage = ciContext.createCGImage(ciImage, from: ciImage.extent) else { return }
        let resizedImage = UIImage(cgImage: cgImage)
        
        // Compress image to JPEG
        guard let jpegData = resizedImage.jpegData(compressionQuality: compressionQuality) else { return }
        
        // Stream the binary frame over WebSocket
        sendBinaryFrame(jpegData)
    }
    
    private func sendBinaryFrame(_ data: Data) {
        guard let ws = webSocketTask else { return }
        
        let message = URLSessionWebSocketMessage.data(data)
        ws.send(message) { [weak self] error in
            guard let self = self, error == nil else { return }
            self.metricsLock.lock()
            self.frameCount += 1
            self.bytesSent += data.count
            self.metricsLock.unlock()
        }
    }
    
    private func startMetricsTimer() {
        fpsTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            self.metricsLock.lock()
            let currentFrames = self.frameCount
            let currentBytes = self.bytesSent
            self.frameCount = 0
            self.bytesSent = 0
            self.metricsLock.unlock()
            
            DispatchQueue.main.async {
                self.fps = currentFrames
                self.sentBytesPerSecond = Double(currentBytes) / 1024.0 // KB/s
            }
        }
    }
    
    deinit {
        fpsTimer?.invalidate()
        disconnect()
    }
}
