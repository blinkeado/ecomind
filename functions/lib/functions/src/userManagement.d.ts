import * as functions from "firebase-functions/v1";
/**
 * Create User Profile on Registration
 * Triggered when a new user signs up
 */
export declare const onUserCreate: functions.CloudFunction<import("firebase-admin/auth").UserRecord>;
/**
 * Clean Up User Data on Account Deletion
 * Triggered when a user deletes their account
 */
export declare const onUserDelete: functions.CloudFunction<import("firebase-admin/auth").UserRecord>;
/**
 * Update User Profile
 * Allows users to update their profile information and preferences
 */
export declare const updateUserProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    profile: any;
    updatedAt: string;
}>, unknown>;
/**
 * Get User Profile
 * Retrieve user profile information
 */
export declare const getUserProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    profile: any;
    retrievedAt: string;
}>, unknown>;
/**
 * Update User Statistics
 * Internal function to update user activity stats
 */
export declare const updateUserStats: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    updatedAt: string;
}>, unknown>;
export declare const userManagement: {
    onUserCreate: functions.CloudFunction<import("firebase-admin/auth").UserRecord>;
    onUserDelete: functions.CloudFunction<import("firebase-admin/auth").UserRecord>;
    updateUserProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
        success: boolean;
        profile: any;
        updatedAt: string;
    }>, unknown>;
    getUserProfile: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
        profile: any;
        retrievedAt: string;
    }>, unknown>;
    updateUserStats: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
        success: boolean;
        updatedAt: string;
    }>, unknown>;
};
//# sourceMappingURL=userManagement.d.ts.map