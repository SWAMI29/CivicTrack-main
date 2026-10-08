// ====================================================================
// CivicTrack – Report Management System (FIXED & WORKING)
// ====================================================================

class ReportManager {
    static currentStep = 1;
    static uploadedImages = [];
    static maxImages = 5;

    static init() {
        this.setupEventListeners();
        this.updateFormProgress();
        this.toggleContactInfo();
        document.getElementById("firstObserved").value = new Date().toISOString().split("T")[0];
        console.log("ReportManager initialized");
    }

    static setupEventListeners() {
        const form = document.getElementById("reportForm");
        if (!form) return console.error("Form not found");

        form.addEventListener("submit", e => this.handleReportSubmission(e));
        document.getElementById("anonymous")?.addEventListener("change", () => this.toggleContactInfo());
        document.getElementById("file_upload")?.addEventListener("change", e => this.handleMultipleFileUpload(e));
    }

    static toggleContactInfo() {
        const info = document.getElementById("contactInfo");
        const anon = document.getElementById("anonymous");
        if (info && anon) info.style.display = anon.checked ? "none" : "block";
    }

    static nextStep(step) {
        if (!this.validateStep(this.currentStep)) {
            this.notify("Please fill required fields.", "warning");
            return;
        }
        this.transitionStep(this.currentStep, step);
        this.currentStep = step;
        this.updateFormProgress();
        if (step === 4) this.populateReviewSection();
    }

    static prevStep(step) {
        this.transitionStep(this.currentStep, step);
        this.currentStep = step;
        this.updateFormProgress();
    }

    static transitionStep(from, to) {
        const current = document.getElementById(`step${from}`);
        const next = document.getElementById(`step${to}`);
        if (!current || !next) return;

        current.classList.add("fade-out");
        setTimeout(() => {
            current.classList.add("d-none");
            current.classList.remove("fade-out");
            next.classList.remove("d-none");
            next.classList.add("fade-in");
            setTimeout(() => next.classList.remove("fade-in"), 300);
        }, 200);
    }

    static validateStep(step) {
        switch (step) {
            case 1: return !!document.getElementById("title").value && !!document.getElementById("category").value;
            case 2: return !!document.getElementById("location").value;
            case 4: return document.getElementById("terms").checked;
            default: return true;
        }
    }

    static updateFormProgress() {
        const bar = document.getElementById("formProgress");
        if (bar) bar.style.width = `${(this.currentStep / 4) * 100}%`;
    }

    static populateReviewSection() {
        const fields = ["title", "category", "urgency", "location", "landmark", "ward", "description", "firstObserved", "recurring"];
        fields.forEach(f => {
            const input = document.getElementById(f);
            const out = document.getElementById(`review${f.charAt(0).toUpperCase() + f.slice(1)}`);
            if (input && out) out.textContent = input.value || "Not provided";
        });
        const hazard = document.getElementById("safetyHazard");
        const reviewHazard = document.getElementById("reviewSafetyHazard");
        if (hazard && reviewHazard) reviewHazard.textContent = hazard.checked ? "Yes" : "No";
    }

    static handleMultipleFileUpload(e) {
        const files = Array.from(e.target.files).slice(0, this.maxImages);
        const container = document.getElementById("imagePreviews");
        const wrapper = document.getElementById("imagePreviewContainer");
        if (!container || !wrapper) return;

        container.innerHTML = "";
        this.uploadedImages = [];
        wrapper.style.display = files.length ? "block" : "none";

        files.forEach((file, i) => {
            if (!file.type.startsWith("image/")) return;
            const reader = new FileReader();
            reader.onload = ev => {
                const id = `img_${Date.now()}_${i}`;
                this.uploadedImages.push({ id, data: ev.target.result, name: file.name });
                const item = document.createElement("div");
                item.className = "image-preview-item";
                item.innerHTML = `
                    <img src="${ev.target.result}" alt="${file.name}">
                    <button type="button" class="btn btn-sm btn-danger remove-image" 
                            onclick="ReportManager.removeImage('${id}')">
                        <i class="fas fa-times"></i>
                    </button>`;
                container.appendChild(item);
            };
            reader.readAsDataURL(file);
        });
    }

    static removeImage(id) {
        this.uploadedImages = this.uploadedImages.filter(img => img.id !== id);
        this.renderImagePreviews();
    }

    static renderImagePreviews() {
        const container = document.getElementById("imagePreviews");
        const wrapper = document.getElementById("imagePreviewContainer");
        if (!container || !wrapper) return;

        container.innerHTML = "";
        if (this.uploadedImages.length === 0) {
            wrapper.style.display = "none";
            return;
        }
        wrapper.style.display = "block";
        this.uploadedImages.forEach(img => {
            const item = document.createElement("div");
            item.className = "image-preview-item";
            item.innerHTML = `
                <img src="${img.data}" alt="${img.name}">
                <button type="button" class="btn btn-sm btn-danger remove-image" 
                        onclick="ReportManager.removeImage('${img.id}')">
                    <i class="fas fa-times"></i>
                </button>`;
            container.appendChild(item);
        });
    }

    static handleReportSubmission(e) {
        e.preventDefault();
        if (!this.validateStep(4)) {
            this.notify("Please accept the terms.", "warning");
            return;
        }

        try {
            const data = new FormData(e.target);
            let allIssues = JSON.parse(localStorage.getItem("civictrack_issues") || "[]");

            const newIssue = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                title: data.get("title"),
                category: data.get("category"),
                description: data.get("description"),
                location: data.get("location"),
                specificLocation: { landmark: data.get("landmark"), ward: data.get("ward") },
                urgency: data.get("urgency"),
                status: "Reported",
                reporter: data.get("anonymous") ? "Anonymous" : (data.get("contact_name") || currentUser?.username || "User"),
                reporterId: data.get("anonymous") ? null : currentUser?.id,
                date: new Date().toISOString(),
                firstObserved: data.get("firstObserved"),
                recurring: data.get("recurring"),
                safetyHazard: data.get("safetyHazard") === "on",
                images: this.uploadedImages,
                videoUrl: data.get("video_url"),
                contact: data.get("anonymous") ? null : {
                    name: data.get("contact_name"),
                    email: data.get("contact_email"),
                    phone: data.get("contact_phone")
                },
                notificationPreferences: {
                    email: data.get("notifyEmail") === "on",
                    sms: data.get("notifySMS") === "on"
                }
            };

            allIssues.unshift(newIssue);
            localStorage.setItem("civictrack_issues", JSON.stringify(allIssues));
            // **FIX: Log activity (no deps)**
let activities = JSON.parse(localStorage.getItem('user_activities') || '[]');
activities.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    userId: currentUser?.id,
    action: 'reported_issue',
    description: `Reported: ${newIssue.title}`,
    timestamp: new Date().toISOString()
});
localStorage.setItem('user_activities', JSON.stringify(activities.slice(0, 100)));

            this.showSuccessMessage(newIssue.id);
            if (typeof ProfileManager !== "undefined") {
                ProfileManager.logActivity("reported_issue", newIssue.title);
            }
            this.notify("Issue reported successfully!", "success");
        } catch (err) {
            console.error("Submission error:", err);
            this.notify("Failed to submit. Please try again.", "danger");
        }
    }

    static showSuccessMessage(id) {
        const success = document.getElementById("successMessage");
        const reportId = document.getElementById("reportId");
        const responseTime = document.getElementById("responseTime");
        const form = document.getElementById("reportForm");

        reportId.textContent = `#${id}`;
        const times = { Low: "5–7 days", Medium: "3–5 days", High: "1–2 days", Critical: "≤ 24 hours" };
        responseTime.textContent = times[document.getElementById("urgency").value] || "2–3 days";

        form.classList.add("fade-out");
        setTimeout(() => {
            form.style.display = "none";
            success.classList.remove("d-none");
            success.classList.add("show");
            success.scrollIntoView({ behavior: "smooth" });
        }, 200);
    }

    static notify(msg, type = "info", timeout = 5000) {
        if (typeof NotificationSystem !== "undefined" && NotificationSystem.show) {
            NotificationSystem.show(msg, type, timeout);
        } else {
            alert(msg);
        }
    }
}

// Global functions
function nextStep(s) { ReportManager.nextStep(s); }
function prevStep(s) { ReportManager.prevStep(s); }
function updateFormProgress() { ReportManager.updateFormProgress(); }
function getCurrentLocationForForm() {
    if (typeof LocationManager !== "undefined") {
        LocationManager.getUserLocation().then(loc => {
            document.getElementById("location").value = `Lat: ${loc.lat.toFixed(4)}, Lng: ${loc.lng.toFixed(4)}`;
            ReportManager.notify("Location added.", "success");
        }).catch(() => ReportManager.notify("Location access denied.", "warning"));
    }
}
function downloadReport() {
    const id = document.getElementById("reportId").textContent.replace("#", "");
    const issue = JSON.parse(localStorage.getItem("civictrack_issues") || "[]").find(i => i.id === id);
    if (issue && typeof DataExporter !== "undefined") DataExporter.exportIssue(issue);
}

// Init
document.addEventListener("DOMContentLoaded", () => ReportManager.init());
window.ReportManager = ReportManager;