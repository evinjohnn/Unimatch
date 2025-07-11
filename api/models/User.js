// api/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";

const promptSchema = new mongoose.Schema({
    prompt: { type: String, required: true },
    answer: { type: String, required: true },
});

const questionnaireSchema = new mongoose.Schema({
    // Demographics
    height: { type: Number, default: 0 },
    education: { type: String, default: "" },
    occupation: { type: String, default: "" },
    relationshipGoals: { type: String, enum: ["casual", "serious", "marriage", "unsure"], default: "unsure" },
    hasChildren: { type: Boolean, default: false },
    wantsChildren: { type: String, enum: ["yes", "no", "maybe"], default: "maybe" },
    
    // Lifestyle
    fitnessLevel: { type: String, enum: ["never", "rarely", "sometimes", "often", "daily"], default: "sometimes" },
    socialLevel: { type: String, enum: ["homebody", "sometimes", "social", "very_social"], default: "sometimes" },
    drinkingHabits: { type: String, enum: ["never", "rarely", "socially", "regularly"], default: "socially" },
    smokingHabits: { type: String, enum: ["never", "rarely", "socially", "regularly"], default: "never" },
    diet: { type: String, enum: ["omnivore", "vegetarian", "vegan", "pescatarian", "other"], default: "omnivore" },
    politicalViews: { type: String, enum: ["liberal", "moderate", "conservative", "other", "prefer_not_to_say"], default: "prefer_not_to_say" },
    religiousViews: { type: String, enum: ["agnostic", "atheist", "buddhist", "christian", "hindu", "jewish", "muslim", "other", "prefer_not_to_say"], default: "prefer_not_to_say" },
    
    // Personality & Interests
    interests: [{ type: String }],
    loveLanguages: [{ type: String, enum: ["physical_touch", "words_of_affirmation", "acts_of_service", "quality_time", "receiving_gifts"] }],
    dealBreakers: [{ type: String }],
    
    // Communication
    communicationStyle: { type: String, enum: ["texter", "caller", "video_chat", "in_person"], default: "texter" },
    responseTime: { type: String, enum: ["immediate", "within_hours", "within_day", "when_convenient"], default: "within_hours" },
});

const behaviorMetricsSchema = new mongoose.Schema({
    ghostingIncidents: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
    inappropriateMessages: { type: Number, default: 0 },
    positiveInteractions: { type: Number, default: 0 },
    conversationLength: { type: Number, default: 0 },
    mutualMatches: { type: Number, default: 0 },
    responseRate: { type: Number, default: 100 },
    averageRating: { type: Number, default: 5 },
    totalRatings: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 },
    likesGiven: { type: Number, default: 0 },
    likesReceived: { type: Number, default: 0 },
});

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: (value) => validator.isEmail(value),
                message: "Invalid email format",
            },
        },
        password: {
            type: String,
            required: true,
        },
        age: {
            type: Number,
            required: true,
        },
        gender: {
            type: String,
            required: true,
            enum: ["male", "female", "non-binary", "other"],
        },
        genderPreference: {
            type: String,
            required: true,
            enum: ["male", "female", "non-binary", "all"],
        },
        
        // Profile Content
        job: { type: String, default: "" },
        school: { type: String, default: "" },
        images: [{ type: String }], // Array of up to 6 images
        prompts: [promptSchema],    // Array of up to 3 prompts
        
        // Enhanced Questionnaire
        questionnaire: { type: questionnaireSchema, default: {} },
        
        // Behavior Metrics
        behaviorMetrics: { type: behaviorMetricsSchema, default: {} },
        
        // Scoring Systems
        credibilityScore: { type: Number, default: 70 },
        behaviorIndex: { type: Number, default: 85 },
        
        // Premium Features
        isPremium: { type: Boolean, default: false },
        premiumExpiry: { type: Date },
        superLikesDaily: { type: Number, default: 1 },
        superLikesUsed: { type: Number, default: 0 },
        boostCredits: { type: Number, default: 0 },
        roses: { type: Number, default: 5 },
        
        // Verification & Security
        isVerified: { type: Boolean, default: false },
        isEmailVerified: { type: Boolean, default: false },
        isPhotoVerified: { type: Boolean, default: false },
        verificationPhotos: [{ type: String }],
        
        // Activity Tracking
        lastActive: { type: Date, default: Date.now },
        onlineStatus: { type: String, enum: ["online", "offline", "away"], default: "offline" },
        
        // Relationships
        matches: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        blockedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        
        // Privacy Settings
        incognitoMode: { type: Boolean, default: false },
        showReadReceipts: { type: Boolean, default: true },
        showOnlineStatus: { type: Boolean, default: true },
        
        // Location (for matching)
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        },
        
        // AI Assistant Settings
        aiAssistantEnabled: { type: Boolean, default: true },
        aiPersonality: { type: String, enum: ["helpful", "witty", "romantic", "casual"], default: "helpful" },
        
        // Analytics
        profileCompleteness: { type: Number, default: 0 },
        accountAge: { type: Number, default: 0 }, // Days since account creation
        
        // Preferences
        ageRange: {
            min: { type: Number, default: 18 },
            max: { type: Number, default: 99 }
        },
        maxDistance: { type: Number, default: 50 }, // in miles
        
        // Notification Settings
        pushNotifications: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: true },
        
        // Login Attempts (Security)
        loginAttempts: { type: Number, default: 0 },
        lockUntil: { type: Date },
    },
    { timestamps: true }
);

// Add geospatial index for location-based matching
userSchema.index({ location: "2dsphere" });

// Security: Account lockout after failed attempts
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Password hashing middleware
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Update profile completeness on save
userSchema.pre("save", function (next) {
    let completeness = 0;
    const totalFields = 10;
    
    if (this.name) completeness += 1;
    if (this.age) completeness += 1;
    if (this.job) completeness += 1;
    if (this.school) completeness += 1;
    if (this.images && this.images.length >= 3) completeness += 2;
    if (this.prompts && this.prompts.length >= 3) completeness += 2;
    if (this.questionnaire && Object.keys(this.questionnaire).length > 5) completeness += 2;
    
    this.profileCompleteness = Math.round((completeness / totalFields) * 100);
    
    // Update account age
    const now = new Date();
    const created = this.createdAt || now;
    this.accountAge = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    
    next();
});

// Update credibility score
userSchema.methods.updateCredibilityScore = function() {
    const metrics = this.behaviorMetrics;
    const weights = {
        averageRating: 0.4,
        responseRate: 0.3,
        profileCompleteness: 0.2,
        accountAge: 0.1
    };
    
    // Normalize account age (max 365 days = 100 points)
    const normalizedAccountAge = Math.min(this.accountAge / 365 * 100, 100);
    
    this.credibilityScore = Math.round(
        (metrics.averageRating * 20 * weights.averageRating) +
        (metrics.responseRate * weights.responseRate) +
        (this.profileCompleteness * weights.profileCompleteness) +
        (normalizedAccountAge * weights.accountAge)
    );
    
    // Ensure score is between 0 and 100
    this.credibilityScore = Math.max(0, Math.min(100, this.credibilityScore));
};

// Update behavior index
userSchema.methods.updateBehaviorIndex = function() {
    const metrics = this.behaviorMetrics;
    const baseScore = 85;
    
    let behaviorScore = baseScore;
    
    // Negative behaviors
    behaviorScore -= (metrics.reportCount * 5);
    behaviorScore -= (metrics.ghostingIncidents * 3);
    behaviorScore -= (metrics.inappropriateMessages * 10);
    
    // Positive behaviors
    behaviorScore += (metrics.positiveInteractions * 2);
    behaviorScore += Math.min(metrics.conversationLength / 10, 5);
    behaviorScore += (metrics.mutualMatches * 3);
    
    this.behaviorIndex = Math.max(0, Math.min(100, Math.round(behaviorScore)));
};

// Password comparison method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

const User = mongoose.model("User", userSchema);
export default User;