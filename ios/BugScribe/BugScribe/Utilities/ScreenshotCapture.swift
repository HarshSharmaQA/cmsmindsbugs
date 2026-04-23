//
//  ScreenshotCapture.swift
//  BugScribe
//
//  Screenshot capture utility
//

import UIKit
import SwiftUI

class ScreenshotCapture {
    static func captureScreen() -> UIImage? {
        guard let window = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap({ $0.windows })
            .first(where: { $0.isKeyWindow }) else {
            return nil
        }
        
        let renderer = UIGraphicsImageRenderer(bounds: window.bounds)
        return renderer.image { context in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
    }
    
    static func captureView(_ view: UIView) -> UIImage? {
        let renderer = UIGraphicsImageRenderer(bounds: view.bounds)
        return renderer.image { context in
            view.drawHierarchy(in: view.bounds, afterScreenUpdates: true)
        }
    }
}
