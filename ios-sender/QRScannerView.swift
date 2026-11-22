import SwiftUI
import AVFoundation

struct QRScannerView: UIViewControllerRepresentable {
    var completion: (String) -> Void
    @Environment(\.presentationMode) var presentationMode
    
    func makeUIViewController(context: Context) -> ScannerViewController {
        let controller = ScannerViewController()
        controller.delegate = context.coordinator
        return controller
    }
    
    func updateUIViewController(_ uiViewController: ScannerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, ScannerViewControllerDelegate {
        var parent: QRScannerView
        
        init(_ parent: QRScannerView) {
            self.parent = parent
        }
        
        func didFindCode(_ code: String) {
            parent.completion(code)
            parent.presentationMode.wrappedValue.dismiss()
        }
        
        func didFailWithError(_ error: Error) {
            print("Scanner error: \(error)")
            parent.presentationMode.wrappedValue.dismiss()
        }
    }
}

protocol ScannerViewControllerDelegate: AnyObject {
    func didFindCode(_ code: String)
    func didFailWithError(_ error: Error)
}

class ScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    weak var delegate: ScannerViewControllerDelegate?
    var captureSession: AVCaptureSession!
    var previewLayer: AVCaptureVideoPreviewLayer!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        view.backgroundColor = UIColor.black
        captureSession = AVCaptureSession()
        
        guard let videoCaptureDevice = AVCaptureDevice.default(for: .video) else { return }
        let videoInput: AVCaptureDeviceInput
        
        do {
            videoInput = try AVCaptureDeviceInput(device: videoCaptureDevice)
        } catch {
            delegate?.didFailWithError(error)
            return
        }
        
        if (captureSession.canAddInput(videoInput)) {
            captureSession.addInput(videoInput)
        } else {
            return
        }
        
        let metadataOutput = AVCaptureMetadataOutput()
        
        if (captureSession.canAddOutput(metadataOutput)) {
            captureSession.addOutput(metadataOutput)
            
            metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
            metadataOutput.metadataObjectTypes = [.qr]
        } else {
            return
        }
        
        previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
        previewLayer.frame = view.layer.bounds
        previewLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(previewLayer)
        
        // Add a beautiful scanning frame overlay
        addScannerOverlay()
        
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession.startRunning()
        }
    }
    
    private func addScannerOverlay() {
        let overlayContainer = UIView(frame: view.bounds)
        overlayContainer.backgroundColor = UIColor.clear
        view.addSubview(overlayContainer)
        
        let size = view.bounds.width * 0.65
        let x = (view.bounds.width - size) / 2
        let y = (view.bounds.height - size) / 2
        let scanRect = CGRect(x: x, y: y, width: size, height: size)
        
        // Blur background around target area
        let maskLayer = CAShapeLayer()
        let path = CGMutablePath()
        path.addRect(view.bounds)
        path.addRoundedRect(in: scanRect, cornerWidth: 24, cornerHeight: 24)
        maskLayer.path = path
        maskLayer.fillRule = .evenOdd
        
        let dimmedView = UIView(frame: view.bounds)
        dimmedView.backgroundColor = UIColor.black.withAlphaComponent(0.6)
        dimmedView.layer.mask = maskLayer
        overlayContainer.addSubview(dimmedView)
        
        // Draw elegant glowing frame
        let frameLayer = CAShapeLayer()
        frameLayer.path = UIBezierPath(roundedRect: scanRect, cornerRadius: 24).cgPath
        frameLayer.strokeColor = UIColor.systemPurple.cgColor
        frameLayer.lineWidth = 4
        frameLayer.fillColor = UIColor.clear.cgColor
        overlayContainer.layer.addSublayer(frameLayer)
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        if (captureSession?.isRunning == true) {
            captureSession.stopRunning()
        }
    }
    
    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        captureSession.stopRunning()
        
        if let metadataObject = metadataObjects.first {
            guard let readableObject = metadataObject as? AVMetadataMachineReadableCodeObject else { return }
            guard let stringValue = readableObject.stringValue else { return }
            AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))
            delegate?.didFindCode(stringValue)
        }
    }
}
