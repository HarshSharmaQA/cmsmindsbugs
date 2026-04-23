//
//  BugReport.swift
//  BugScribe
//
//  Bug report model
//

import Foundation
import UIKit

enum BugType: String, CaseIterable, Codable {
    case general = "general"
    case uiUx = "ui_ux"
    case performance = "performance"
    case security = "security"
    case crash = "crash"
    case network = "network"
    
    var displayName: String {
        switch self {
        case .general: return "General"
        case .uiUx: return "UI/UX"
        case .performance: return "Performance"
        case .security: return "Security"
        case .crash: return "Crash"
        case .network: return "Network"
        }
    }
    
    var icon: String {
        switch self {
        case .general: return "exclamationmark.circle"
        case .uiUx: return "paintbrush"
        case .performance: return "speedometer"
        case .security: return "lock.shield"
        case .crash: return "xmark.octagon"
        case .network: return "network"
        }
    }
}

enum BugPriority: String, CaseIterable, Codable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    case critical = "critical"
    
    var displayName: String {
        rawValue.capitalized
    }
    
    var color: String {
        switch self {
        case .low: return "green"
        case .medium: return "yellow"
        case .high: return "orange"
        case .critical: return "red"
        }
    }
}

struct BugReport: Identifiable, Codable {
    let id: String
    var title: String
    var description: String
    var type: BugType
    var priority: BugPriority
    var screenshot: Data?
    var deviceInfo: DeviceInfo
    var createdAt: Date
    
    init(id: String = UUID().uuidString,
         title: String,
         description: String,
         type: BugType = .general,
         priority: BugPriority = .medium,
         screenshot: Data? = nil,
         deviceInfo: DeviceInfo = DeviceInfo(),
         createdAt: Date = Date()) {
        self.id = id
        self.title = title
        self.description = description
        self.type = type
        self.priority = priority
        self.screenshot = screenshot
        self.deviceInfo = deviceInfo
        self.createdAt = createdAt
    }
}

struct DeviceInfo: Codable {
    let deviceModel: String
    let osVersion: String
    let appVersion: String
    let screenSize: String
    
    init() {
        self.deviceModel = UIDevice.current.model
        self.osVersion = UIDevice.current.systemVersion
        self.appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        let screen = UIScreen.main.bounds
        self.screenSize = "\(Int(screen.width))x\(Int(screen.height))"
    }
}
