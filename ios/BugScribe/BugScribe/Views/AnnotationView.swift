//
//  AnnotationView.swift
//  BugScribe
//
//  Image annotation view with drawing tools
//

import SwiftUI
import PencilKit

struct AnnotationView: View {
    let image: UIImage
    let onSave: (UIImage) -> Void
    
    @Environment(\.dismiss) var dismiss
    @State private var canvasView = PKCanvasView()
    @State private var selectedTool: AnnotationTool = .pen
    @State private var selectedColor: Color = .red
    @State private var showingColorPicker = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Canvas
                CanvasViewRepresentable(
                    canvasView: $canvasView,
                    image: image,
                    selectedTool: selectedTool,
                    selectedColor: selectedColor
                )
                
                // Toolbar
                VStack(spacing: 12) {
                    // Tools
                    HStack(spacing: 16) {
                        ForEach(AnnotationTool.allCases, id: \.self) { tool in
                            ToolButton(
                                tool: tool,
                                isSelected: selectedTool == tool,
                                action: { selectedTool = tool }
                            )
                        }
                        
                        Spacer()
                        
                        Button(action: { canvasView.drawing = PKDrawing() }) {
                            Image(systemName: "arrow.uturn.backward")
                                .font(.title3)
                                .foregroundColor(.red)
                                .frame(width: 44, height: 44)
                                .background(Color.gray.opacity(0.1))
                                .cornerRadius(8)
                        }
                    }
                    
                    // Colors
                    HStack(spacing: 12) {
                        ForEach(AnnotationColor.allCases, id: \.self) { color in
                            ColorButton(
                                color: color.color,
                                isSelected: selectedColor == color.color,
                                action: { selectedColor = color.color }
                            )
                        }
                    }
                }
                .padding()
                .background(Color(UIColor.systemBackground))
            }
            .navigationTitle("Annotate")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        saveAnnotatedImage()
                    }
                }
            }
        }
    }
    
    private func saveAnnotatedImage() {
        let renderer = UIGraphicsImageRenderer(size: image.size)
        let annotatedImage = renderer.image { context in
            // Draw original image
            image.draw(at: .zero)
            
            // Draw annotations
            let drawing = canvasView.drawing
            let drawingImage = drawing.image(from: CGRect(origin: .zero, size: image.size), scale: 1.0)
            drawingImage.draw(at: .zero)
        }
        
        onSave(annotatedImage)
    }
}

// MARK: - Canvas View Representable

struct CanvasViewRepresentable: UIViewRepresentable {
    @Binding var canvasView: PKCanvasView
    let image: UIImage
    let selectedTool: AnnotationTool
    let selectedColor: Color
    
    func makeUIView(context: Context) -> PKCanvasView {
        canvasView.drawingPolicy = .anyInput
        canvasView.backgroundColor = .clear
        
        // Add image as background
        let imageView = UIImageView(image: image)
        imageView.contentMode = .scaleAspectFit
        imageView.frame = canvasView.bounds
        imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        canvasView.insertSubview(imageView, at: 0)
        
        updateTool()
        
        return canvasView
    }
    
    func updateUIView(_ uiView: PKCanvasView, context: Context) {
        updateTool()
    }
    
    private func updateTool() {
        let uiColor = UIColor(selectedColor)
        
        switch selectedTool {
        case .pen:
            canvasView.tool = PKInkingTool(.pen, color: uiColor, width: 3)
        case .marker:
            canvasView.tool = PKInkingTool(.marker, color: uiColor, width: 10)
        case .pencil:
            canvasView.tool = PKInkingTool(.pencil, color: uiColor, width: 2)
        case .eraser:
            canvasView.tool = PKEraserTool(.bitmap)
        }
    }
}

// MARK: - Tool Button

struct ToolButton: View {
    let tool: AnnotationTool
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Image(systemName: tool.icon)
                .font(.title3)
                .foregroundColor(isSelected ? .white : .primary)
                .frame(width: 44, height: 44)
                .background(isSelected ? Color.blue : Color.gray.opacity(0.1))
                .cornerRadius(8)
        }
    }
}

// MARK: - Color Button

struct ColorButton: View {
    let color: Color
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Circle()
                .fill(color)
                .frame(width: 32, height: 32)
                .overlay(
                    Circle()
                        .strokeBorder(Color.white, lineWidth: isSelected ? 3 : 0)
                )
                .overlay(
                    Circle()
                        .strokeBorder(Color.gray.opacity(0.3), lineWidth: 1)
                )
        }
    }
}

// MARK: - Annotation Tool

enum AnnotationTool: CaseIterable {
    case pen
    case marker
    case pencil
    case eraser
    
    var icon: String {
        switch self {
        case .pen: return "pencil"
        case .marker: return "highlighter"
        case .pencil: return "pencil.tip"
        case .eraser: return "eraser"
        }
    }
}

// MARK: - Annotation Color

enum AnnotationColor: CaseIterable {
    case red
    case yellow
    case green
    case blue
    case purple
    case black
    
    var color: Color {
        switch self {
        case .red: return .red
        case .yellow: return .yellow
        case .green: return .green
        case .blue: return .blue
        case .purple: return .purple
        case .black: return .black
        }
    }
}

#Preview {
    AnnotationView(image: UIImage(systemName: "photo")!) { _ in }
}
