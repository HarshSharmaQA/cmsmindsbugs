//
//  NetworkManager.swift
//  BugScribe
//
//  Network manager for API calls
//

import Foundation
import UIKit

class NetworkManager {
    static let shared = NetworkManager()
    
    private let baseURL = "https://cmsmindsqa.vercel.app"
    
    private init() {}
    
    // MARK: - Submit Bug Report
    
    func submitBugReport(
        project: Project,
        report: BugReport,
        userName: String,
        userEmail: String?,
        completion: @escaping (Result<String, Error>) -> Void
    ) {
        guard let url = URL(string: "\(baseURL)/api/submit-bug") else {
            completion(.failure(NetworkError.invalidURL))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Convert screenshot to base64
        var screenshotBase64: String?
        if let imageData = report.screenshot {
            screenshotBase64 = "data:image/png;base64," + imageData.base64EncodedString()
        }
        
        let payload: [String: Any] = [
            "projectId": project.projectId,
            "apiKey": project.apiKey,
            "title": report.title,
            "description": report.description,
            "type": report.type.rawValue,
            "priority": report.priority.rawValue,
            "reporterName": userName,
            "reporterEmail": userEmail ?? "",
            "screenshot": screenshotBase64 ?? "",
            "deviceInfo": [
                "deviceModel": report.deviceInfo.deviceModel,
                "osVersion": report.deviceInfo.osVersion,
                "appVersion": report.deviceInfo.appVersion,
                "screenSize": report.deviceInfo.screenSize,
                "platform": "iOS"
            ],
            "createdAt": ISO8601DateFormatter().string(from: report.createdAt)
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        } catch {
            completion(.failure(error))
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                DispatchQueue.main.async {
                    completion(.failure(error))
                }
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                DispatchQueue.main.async {
                    completion(.failure(NetworkError.invalidResponse))
                }
                return
            }
            
            guard (200...299).contains(httpResponse.statusCode) else {
                DispatchQueue.main.async {
                    completion(.failure(NetworkError.serverError(statusCode: httpResponse.statusCode)))
                }
                return
            }
            
            DispatchQueue.main.async {
                completion(.success("Bug report submitted successfully"))
            }
        }.resume()
    }
    
    // MARK: - Check Reporting Status
    
    func checkReportingStatus(
        project: Project,
        completion: @escaping (Result<Bool, Error>) -> Void
    ) {
        guard let url = URL(string: "\(baseURL)/api/check-reporting-status") else {
            completion(.failure(NetworkError.invalidURL))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload: [String: Any] = [
            "projectId": project.projectId,
            "apiKey": project.apiKey
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        } catch {
            completion(.failure(error))
            return
        }
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                DispatchQueue.main.async {
                    completion(.failure(error))
                }
                return
            }
            
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let enabled = json["enabled"] as? Bool else {
                DispatchQueue.main.async {
                    completion(.success(true)) // Default to enabled
                }
                return
            }
            
            DispatchQueue.main.async {
                completion(.success(enabled))
            }
        }.resume()
    }
}

enum NetworkError: LocalizedError {
    case invalidURL
    case invalidResponse
    case serverError(statusCode: Int)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .serverError(let code):
            return "Server error: \(code)"
        }
    }
}
