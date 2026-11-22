import SwiftUI

struct ContentView: View {
    @StateObject private var streamer = ScreenStreamer()
    @State private var inputIP = ""
    @State private var showSettings = false
    @State private var showScanner = false
    
    var body: some View {
        ZStack {
            // Dark Gradient Background
            LinearGradient(
                gradient: Gradient(colors: [Color(red: 10/255, green: 14/255, blue: 24/255), Color(red: 5/255, green: 7/255, blue: 10/255)]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            // Floating background glowing circles
            VStack {
                HStack {
                    Circle()
                        .fill(Color.purple.opacity(0.12))
                        .frame(width: 250, height: 250)
                        .blur(radius: 50)
                        .offset(x: -50, y: -50)
                    Spacer()
                }
                Spacer()
                HStack {
                    Spacer()
                    Circle()
                        .fill(Color.cyan.opacity(0.1))
                        .frame(width: 200, height: 200)
                        .blur(radius: 40)
                        .offset(x: 50, y: 50)
                }
            }
            .ignoresSafeArea()
            
            // Main content
            VStack(spacing: 24) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("AuraCast")
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [Color.purple, Color.cyan],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                        
                        Text("Local Network Mirroring")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.gray)
                    }
                    Spacer()
                    
                    Button(action: { showSettings.toggle() }) {
                        Image(systemName: "slider.horizontal.3")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(width: 44, height: 44)
                            .background(Color.white.opacity(0.06))
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.white.opacity(0.08), lineWidth: 1))
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 20)
                
                // Connection Panel
                VStack(spacing: 20) {
                    HStack(spacing: 12) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("RECEIVER IP")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.purple)
                            
                            HStack(spacing: 8) {
                                TextField("e.g. 192.168.1.50", text: $inputIP)
                                    .font(.system(size: 18, weight: .semibold, design: .monospaced))
                                    .foregroundColor(.white)
                                    .keyboardType(.decimalPad)
                                    .onChange(of: inputIP) { newValue in
                                        streamer.serverIP = newValue
                                    }
                                
                                Button(action: { showScanner = true }) {
                                    Image(systemName: "qrcode.viewfinder")
                                        .font(.system(size: 20, weight: .bold))
                                        .foregroundColor(.purple)
                                        .frame(width: 38, height: 38)
                                        .background(Color.purple.opacity(0.12))
                                        .clipShape(RoundedRectangle(cornerRadius: 10))
                                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.purple.opacity(0.2), lineWidth: 1))
                                }
                            }
                        }
                        
                        Spacer()
                        
                        Button(action: {
                            if streamer.connectionStatus == "Connected" || streamer.connectionStatus == "Streaming Live" {
                                streamer.disconnect()
                            } else {
                                streamer.connect()
                            }
                        }) {
                            Text(streamer.connectionStatus == "Connected" || streamer.connectionStatus == "Streaming Live" ? "Disconnect" : "Connect")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                                .background(
                                    streamer.connectionStatus == "Connected" || streamer.connectionStatus == "Streaming Live"
                                    ? Color.red.opacity(0.2)
                                    : Color.purple.opacity(0.2)
                                )
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(
                                            streamer.connectionStatus == "Connected" || streamer.connectionStatus == "Streaming Live"
                                            ? Color.red.opacity(0.4)
                                            : Color.purple.opacity(0.4),
                                            lineWidth: 1
                                        )
                                )
                        }
                    }
                    .padding(20)
                    .background(Color.white.opacity(0.03))
                    .cornerRadius(20)
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white.opacity(0.05), lineWidth: 1))
                    
                    // Status Badge
                    HStack {
                        Circle()
                            .fill(streamer.connectionStatus == "Streaming Live" ? Color.green : (streamer.connectionStatus == "Connected" ? Color.blue : Color.gray))
                            .frame(width: 8, height: 8)
                        
                        Text(streamer.connectionStatus)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white.opacity(0.8))
                        
                        Spacer()
                    }
                    .padding(.horizontal, 8)
                }
                .padding(.horizontal, 24)
                
                // Real-time Stats Panel (Show when active)
                if streamer.connectionStatus == "Streaming Live" {
                    HStack(spacing: 20) {
                        VStack(spacing: 4) {
                            Text("FPS")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.gray)
                            Text("\(streamer.fps)")
                                .font(.system(size: 24, weight: .bold, design: .rounded))
                                .foregroundColor(.green)
                        }
                        .frame(maxWidth: .infinity)
                        
                        Divider().background(Color.white.opacity(0.1))
                        
                        VStack(spacing: 4) {
                            Text("BANDWIDTH")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.gray)
                            Text(String(format: "%.1f KB/s", streamer.sentBytesPerSecond))
                                .font(.system(size: 20, weight: .bold, design: .rounded))
                                .foregroundColor(.cyan)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .padding(20)
                    .background(Color.white.opacity(0.02))
                    .cornerRadius(20)
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white.opacity(0.04), lineWidth: 1))
                    .padding(.horizontal, 24)
                    .transition(.scale.combined(with: .opacity))
                }
                
                Spacer()
                
                // Big Circular Trigger Button
                Button(action: {
                    if streamer.isStreaming {
                        streamer.stopStreaming()
                    } else {
                        streamer.startStreaming()
                    }
                }) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: streamer.isStreaming ? [Color.red, Color.orange] : [Color.purple, Color.cyan],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 160, height: 160)
                            .shadow(color: (streamer.isStreaming ? Color.red : Color.purple).opacity(0.4), radius: 25)
                        
                        VStack(spacing: 8) {
                            Image(systemName: streamer.isStreaming ? "stop.fill" : "play.fill")
                                .font(.system(size: 40))
                                .foregroundColor(.white)
                            
                            Text(streamer.isStreaming ? "STOP" : "START")
                                .font(.system(size: 16, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                                .tracking(1.5)
                        }
                    }
                }
                .disabled(streamer.connectionStatus != "Connected" && streamer.connectionStatus != "Streaming Live")
                .opacity(streamer.connectionStatus == "Connected" || streamer.connectionStatus == "Streaming Live" ? 1.0 : 0.5)
                .animation(.spring(), value: streamer.isStreaming)
                
                Spacer()
            }
            
            // Quality Settings Panel (Overlay)
            if showSettings {
                Color.black.opacity(0.5)
                    .ignoresSafeArea()
                    .onTapGesture { showSettings = false }
                
                VStack(spacing: 24) {
                    HStack {
                        Text("Stream Quality Settings")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                        Button(action: { showSettings = false }) {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 24))
                                .foregroundColor(.white.opacity(0.6))
                        }
                    }
                    .padding(.bottom, 8)
                    
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("Resolution Scale:")
                            Spacer()
                            Text(String(format: "%.0f%%", streamer.scaleFactor * 100))
                                .foregroundColor(.cyan)
                                .fontWeight(.bold)
                        }
                        Slider(value: Binding(
                            get: { streamer.scaleFactor },
                            set: { streamer.scaleFactor = $0 }
                        ), in: 0.3...1.0, step: 0.1)
                        Text("Lower resolution significantly increases FPS on slower Wi-Fi.")
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                    }
                    
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("JPEG Compression:")
                            Spacer()
                            Text(String(format: "%.0f%%", streamer.compressionQuality * 100))
                                .foregroundColor(.cyan)
                                .fontWeight(.bold)
                        }
                        Slider(value: Binding(
                            get: { streamer.compressionQuality },
                            set: { streamer.compressionQuality = $0 }
                        ), in: 0.2...0.9, step: 0.05)
                        Text("Decreasing quality improves framerate and latency.")
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                    }
                    
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("Max Target FPS:")
                            Spacer()
                            Text("\(Int(streamer.maxFPS)) FPS")
                                .foregroundColor(.cyan)
                                .fontWeight(.bold)
                        }
                        Slider(value: Binding(
                            get: { streamer.maxFPS },
                            set: { streamer.maxFPS = $0 }
                        ), in: 15...60, step: 5)
                    }
                    
                    Button(action: { showSettings = false }) {
                        Text("Apply & Save")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(LinearGradient(colors: [.purple, .cyan], startPoint: .leading, endPoint: .trailing))
                            .cornerRadius(14)
                    }
                    .padding(.top, 8)
                }
                .padding(28)
                .background(Color(red: 20/255, green: 25/255, blue: 40/255))
                .cornerRadius(30)
                .overlay(RoundedRectangle(cornerRadius: 30).stroke(Color.white.opacity(0.1), lineWidth: 1))
                .padding(24)
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .animation(.spring(), value: showSettings)
            }
            .sheet(isPresented: $showScanner) {
                QRScannerView { code in
                    if let url = URL(string: code), let host = url.host {
                        self.inputIP = host
                        streamer.serverIP = host
                        if let port = url.port {
                            streamer.serverPort = String(port)
                        }
                        streamer.connect()
                    } else {
                        let clean = code.trimmingCharacters(in: .whitespacesAndNewlines)
                        self.inputIP = clean
                        streamer.serverIP = clean
                        streamer.connect()
                    }
                }
            }
        }
    }
}
