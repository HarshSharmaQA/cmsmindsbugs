//
//  BugReportView.swift
//  BugScribe
//
//  Bug report submission view
//

import SwiftUI
import PhotosUI

struct BugReportView: View {
    @EnvironmentObject var storageManager: StorageManager
    @State private var title = ""
    @State private var description = ""
    @State private var bugType: BugType = .general
    @State private var priority: BugPriority = .medium
    @State private var screenshot: UIImage?
    @State private var showingImagePicker = false
    @State private var showingAnnotation = false
    @State private var showingCamera = false
    @State private var isSubmitting = false
    @State private var showingSuccess = false
    @State private var showingError = false
    @State private var errorMessage = ""
    @State private var sourceType: UIImagePickerController.SourceType = .photoLibrary
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Bug Details")) {
                    TextField("Title", text: $title)
                        .textContentType(.none)
                    
                    Picker("Type", selection: $bugType) {
                        ForEach(BugType.allCases, id: \.self) { type in
                            Label(type.displayName, systemImage: type.icon)
                                .tag(type)
                        }
                    }
                    
                    Picker("Priority", selection: $priority) {
                        ForEach(BugPriority.allCases, id: \.self) { priority in
                            Text(priority.displayName)
                                .tag(priority)
                        }
                    }
                    
                    TextEditor(text: $description)
                        .frame(minHeight: 100)
                        .overlay(
                            Group {
                                if description.isEmpty {
                                    Text("Describe the bug...")
                                        .foregroundColor(.gray.opacity(0.5))
                                        .padding(.top, 8)
                                        .padding(.leading, 4)
                                        .allowsHitTesting(false)
                                }
                            },
                            alignment: .topLeading
                        )
                }
                
                Section(header: Text("Screenshot")) {
                    if let screenshot = screenshot {
                        VStack(spacing: 12) {
                            Image(uiImage: screenshot)
                                .resizable()
                                .scaledToFit()
                                .frame(maxHeight: 200)
                                .cornerRadius(8)
                            
                            HStack(spacing: 12) {
                                Button(action: { showingAnnotation = true }) {
                                    Label("Annotate", systemImage: "pencil.tip.crop.circle")
                                        .font(.subheadline)
                                }
                                .buttonStyle(.bordered)
                                
                                Button(role: .destructive, action: { self.screenshot = nil }) {
                                    Label("Remove", systemImage: "trash")
                                        .font(.subheadline)
                                }
                                .buttonStyle(.bordered)
                            }
                        }
                    } else {
                        VStack(spacing: 12) {
                            Button(action: {
                                sourceType = .camera
                                showingCamera = true
                            }) {
                                Label("Take Screenshot", systemImage: "camera")
                            }
                            
                            Button(action: {
                                sourceType = .photoLibrary
                                showingImagePicker = true
                            }) {
                                Label("Choose from Library", systemImage: "photo.on.rectangle")
                            }
                        }
                    }
                }
                
                Section {
                    Button(action: submitBugReport) {
                        if isSubmitting {
                            HStack {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle())
                                Text("Submitting...")
                            }
                        } else {
                            Text("Submit Bug Report")
                                .fontWeight(.semibold)
                        }
                    }
                    .disabled(!isValid || isSubmitting)
                    .frame(maxWidth: .infinity)
                }
            }
            .navigationTitle("Report Bug")
            .sheet(isPresented: $showingImagePicker) {
                ImagePicker(image: $screenshot, sourceType: sourceType)
            }
            .sheet(isPresented: $showingCamera) {
                ImagePicker(image: $screenshot, sourceType: .camera)
            }
            .sheet(isPresented: $showingAnnotation) {
                if let screenshot = screenshot {
                    AnnotationView(image: screenshot) { annotatedImage in
                        self.screenshot = annotatedImage
                        showingAnnotation = false
                    }
                }
            }
            .alert("Success", isPresented: $showingSuccess) {
                Button("OK", role: .cancel) {
                    resetForm()
                }
            } message: {
                Text("Bug report submitted successfully!")
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage)
            }
        }
    }
    
    private var isValid: Bool {
        !title.isEmpty && !description.isEmpty
    }
    
    private func submitBugReport() {
        guard let project = storageManager.activeProject else {
            errorMessage = "No active project selected"
            showingError = true
            return
        }
        
        guard let userName = storageManager.userName, !userName.isEmpty else {
            errorMessage = "Please set your name in Settings"
            showingError = true
            return
        }
        
        isSubmitting = true
        
        let screenshotData = screenshot?.pngData()
        
        let report = BugReport(
            title: title,
            description: description,
            type: bugType,
            priority: priority,
            screenshot: screenshotData
        )
        
        NetworkManager.shared.submitBugReport(
            project: project,
            report: report,
            userName: userName,
            userEmail: storageManager.userEmail
        ) { result in
            isSubmitting = false
            
            switch result {
            case .success:
                showingSuccess = true
            case .failure(let error):
                errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }
    
    private func resetForm() {
        title = ""
        description = ""
        bugType = .general
        priority = .medium
        screenshot = nil
    }
}

// MARK: - Image Picker

struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    var sourceType: UIImagePickerController.SourceType
    @Environment(\.dismiss) var dismiss
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = sourceType
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.image = image
            }
            parent.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

#Preview {
    BugReportView()
        .environmentObject(StorageManager.shared)
}
