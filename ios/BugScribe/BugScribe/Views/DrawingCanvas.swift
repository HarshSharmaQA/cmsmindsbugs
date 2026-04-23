//
//  DrawingCanvas.swift
//  BugScribe
//
//  Custom drawing canvas for annotations
//

import SwiftUI

struct DrawingCanvas: View {
    @Binding var lines: [Line]
    @State private var currentLine = Line(points: [], color: .red, lineWidth: 3)
    
    var body: some View {
        Canvas { context, size in
            for line in lines {
                var path = Path()
                path.addLines(line.points)
                context.stroke(
                    path,
                    with: .color(line.color),
                    lineWidth: line.lineWidth
                )
            }
        }
        .gesture(
            DragGesture(minimumDistance: 0)
                .onChanged { value in
                    let point = value.location
                    currentLine.points.append(point)
                }
                .onEnded { _ in
                    if !currentLine.points.isEmpty {
                        lines.append(currentLine)
                        currentLine = Line(points: [], color: currentLine.color, lineWidth: currentLine.lineWidth)
                    }
                }
        )
    }
}

struct Line: Identifiable {
    let id = UUID()
    var points: [CGPoint]
    var color: Color
    var lineWidth: CGFloat
}

#Preview {
    DrawingCanvas(lines: .constant([]))
}
