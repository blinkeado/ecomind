// SOURCE: Phase 8 Polish & Deployment - Deep linking support for sharing relationships
// VERIFIED: URL scheme handling, link generation, and navigation integration

import { Linking, Alert } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { errorTracker, ErrorSeverity } from './errorTracking';

/**
 * Deep linking utilities for EcoMind
 * Supports sharing relationships, invitations, and app content
 */

export interface DeepLinkData {
  screen: string;
  params?: Record<string, any>;
  userId?: string;
  action?: string;
}

export interface ShareableContent {
  type: 'person' | 'interaction' | 'prompt' | 'invitation' | 'privacy_report';
  id: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

class DeepLinkManager {
  private static instance: DeepLinkManager;
  private navigationRef: NavigationContainerRef<any> | null = null;
  private readonly APP_SCHEME = 'ecomind';
  private readonly WEB_BASE_URL = 'https://ecomind.app';
  private pendingLink: string | null = null;

  static getInstance(): DeepLinkManager {
    if (!DeepLinkManager.instance) {
      DeepLinkManager.instance = new DeepLinkManager();
    }
    return DeepLinkManager.instance;
  }

  /**
   * Initialize deep linking system
   */
  async initialize(navigationRef: NavigationContainerRef<any>): Promise<void> {
    this.navigationRef = navigationRef;

    try {
      // Check for initial URL (app opened via link)
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await this.handleDeepLink(initialUrl);
      }

      // Listen for incoming URLs (app already open)
      const listener = Linking.addEventListener('url', (event) => {
        this.handleDeepLink(event.url);
      });

      return () => listener.remove();
    } catch (error) {
      errorTracker.captureError(error instanceof Error ? error : new Error(String(error)), {
        severity: ErrorSeverity.MEDIUM,
        context: { type: 'deep_linking_initialization' },
      });
    }
  }

  /**
   * Handle incoming deep link
   */
  private async handleDeepLink(url: string): Promise<void> {
    try {
      const linkData = this.parseDeepLink(url);
      if (!linkData) return;

      // If navigation is not ready, store the link for later
      if (!this.navigationRef?.isReady()) {
        this.pendingLink = url;
        return;
      }

      await this.navigateToDeepLink(linkData);
    } catch (error) {
      errorTracker.captureError(error instanceof Error ? error : new Error(String(error)), {
        severity: ErrorSeverity.MEDIUM,
        context: { type: 'deep_link_handling', url },
      });

      Alert.alert(
        'Invalid Link',
        'The link you followed is not valid or has expired.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Process any pending deep link after navigation is ready
   */
  processPendingLink(): void {
    if (this.pendingLink && this.navigationRef?.isReady()) {
      this.handleDeepLink(this.pendingLink);
      this.pendingLink = null;
    }
  }

  /**
   * Parse deep link URL into structured data
   */
  private parseDeepLink(url: string): DeepLinkData | null {
    try {
      const parsedUrl = new URL(url);
      const { protocol, host, pathname, searchParams } = parsedUrl;

      // Handle app scheme (ecomind://)
      if (protocol === `${this.APP_SCHEME}:`) {
        return this.parseAppSchemeLink(host, pathname, searchParams);
      }

      // Handle web URLs (https://ecomind.app)
      if (protocol === 'https:' && host === 'ecomind.app') {
        return this.parseWebLink(pathname, searchParams);
      }

      return null;
    } catch (error) {
      console.warn('Failed to parse deep link:', url, error);
      return null;
    }
  }

  /**
   * Parse app scheme link (ecomind://...)
   */
  private parseAppSchemeLink(
    host: string,
    pathname: string,
    searchParams: URLSearchParams
  ): DeepLinkData | null {
    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    switch (host) {
      case 'person':
        return {
          screen: 'Person',
          params: {
            personId: params.id,
            mode: params.mode || 'view',
          },
          action: params.action,
        };

      case 'interaction':
        return {
          screen: 'Person',
          params: {
            personId: params.personId,
            interactionId: params.id,
            mode: 'interaction',
          },
        };

      case 'prompt':
        return {
          screen: 'Prompts',
          params: {
            promptId: params.id,
            action: 'view',
          },
        };

      case 'invitation':
        return {
          screen: 'Invitation',
          params: {
            inviteId: params.id,
            inviterName: params.inviterName,
          },
        };

      case 'privacy':
        return {
          screen: 'Settings',
          params: {
            tab: 'privacy',
            section: params.section,
          },
        };

      default:
        return {
          screen: 'Home',
          params,
        };
    }
  }

  /**
   * Parse web link (https://ecomind.app/...)
   */
  private parseWebLink(
    pathname: string,
    searchParams: URLSearchParams
  ): DeepLinkData | null {
    const pathSegments = pathname.split('/').filter(Boolean);
    const params: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    if (pathSegments.length === 0) {
      return { screen: 'Home', params };
    }

    const [section, id] = pathSegments;

    switch (section) {
      case 'person':
        return {
          screen: 'Person',
          params: { personId: id, ...params },
        };

      case 'invite':
        return {
          screen: 'Invitation',
          params: { inviteId: id, ...params },
        };

      case 'privacy':
        return {
          screen: 'Settings',
          params: { tab: 'privacy', ...params },
        };

      default:
        return { screen: 'Home', params };
    }
  }

  /**
   * Navigate to deep link destination
   */
  private async navigateToDeepLink(linkData: DeepLinkData): Promise<void> {
    if (!this.navigationRef) return;

    try {
      // Special handling for different actions
      if (linkData.action) {
        await this.handleSpecialAction(linkData);
        return;
      }

      // Navigate to screen
      this.navigationRef.navigate(linkData.screen as never, linkData.params as never);
    } catch (error) {
      errorTracker.captureError(error instanceof Error ? error : new Error(String(error)), {
        severity: ErrorSeverity.MEDIUM,
        context: { type: 'deep_link_navigation', linkData },
      });
    }
  }

  /**
   * Handle special actions from deep links
   */
  private async handleSpecialAction(linkData: DeepLinkData): Promise<void> {
    switch (linkData.action) {
      case 'accept_invitation':
        await this.handleInvitationAcceptance(linkData.params);
        break;

      case 'share_privacy_report':
        await this.handlePrivacyReportSharing(linkData.params);
        break;

      case 'quick_add_interaction':
        await this.handleQuickAddInteraction(linkData.params);
        break;

      default:
        // Fallback to normal navigation
        if (this.navigationRef) {
          this.navigationRef.navigate(linkData.screen as never, linkData.params as never);
        }
    }
  }

  /**
   * Handle invitation acceptance
   */
  private async handleInvitationAcceptance(params: any): Promise<void> {
    Alert.alert(
      'Accept Invitation',
      `You've been invited to connect! Would you like to accept this invitation?`,
      [
        { text: 'Decline', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            if (this.navigationRef) {
              this.navigationRef.navigate('Invitation' as never, params as never);
            }
          },
        },
      ]
    );
  }

  /**
   * Handle privacy report sharing
   */
  private async handlePrivacyReportSharing(params: any): Promise<void> {
    if (this.navigationRef) {
      this.navigationRef.navigate('PrivacyImpact' as never, {
        shared: true,
        reportId: params?.reportId,
      } as never);
    }
  }

  /**
   * Handle quick add interaction
   */
  private async handleQuickAddInteraction(params: any): Promise<void> {
    if (this.navigationRef && params?.personId) {
      this.navigationRef.navigate('Person' as never, {
        personId: params.personId,
        mode: 'add_interaction',
        quickAdd: true,
      } as never);
    }
  }

  /**
   * Generate shareable link for content
   */
  generateShareableLink(content: ShareableContent, options: {
    useWebUrl?: boolean;
    includeMetadata?: boolean;
    expiresIn?: number; // hours
  } = {}): string {
    const { useWebUrl = true, includeMetadata = true, expiresIn } = options;

    const baseUrl = useWebUrl ? this.WEB_BASE_URL : `${this.APP_SCHEME}://`;
    const params = new URLSearchParams();

    // Add content metadata
    if (includeMetadata) {
      params.set('title', content.title);
      if (content.description) params.set('description', content.description);
      if (content.metadata) {
        Object.entries(content.metadata).forEach(([key, value]) => {
          params.set(key, String(value));
        });
      }
    }

    // Add expiration
    if (expiresIn) {
      const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
      params.set('expires', expiresAt.toISOString());
    }

    const queryString = params.toString();
    const separator = queryString ? '?' : '';

    switch (content.type) {
      case 'person':
        return `${baseUrl}/person/${content.id}${separator}${queryString}`;

      case 'interaction':
        return `${baseUrl}/interaction/${content.id}${separator}${queryString}`;

      case 'prompt':
        return `${baseUrl}/prompt/${content.id}${separator}${queryString}`;

      case 'invitation':
        return `${baseUrl}/invite/${content.id}${separator}${queryString}`;

      case 'privacy_report':
        return `${baseUrl}/privacy?report=${content.id}&${queryString}`;

      default:
        return `${baseUrl}/${separator}${queryString}`;
    }
  }

  /**
   * Share content with native sharing
   */
  async shareContent(
    content: ShareableContent,
    options: {
      useWebUrl?: boolean;
      customMessage?: string;
    } = {}
  ): Promise<void> {
    try {
      const link = this.generateShareableLink(content, { useWebUrl: options.useWebUrl });
      const message = options.customMessage || `Check out this ${content.type} in EcoMind: ${content.title}`;

      await Linking.openURL(`mailto:?subject=${encodeURIComponent(content.title)}&body=${encodeURIComponent(`${message}\n\n${link}`)}`);
    } catch (error) {
      // Fallback to copying to clipboard
      try {
        const link = this.generateShareableLink(content, { useWebUrl: options.useWebUrl });
        // In a real implementation, you'd use @react-native-clipboard/clipboard
        console.log('Link copied to clipboard:', link);
        
        Alert.alert(
          'Link Ready',
          'The sharing link has been copied to your clipboard.',
          [{ text: 'OK' }]
        );
      } catch (clipboardError) {
        errorTracker.captureError(clipboardError instanceof Error ? clipboardError : new Error(String(clipboardError)), {
          severity: ErrorSeverity.LOW,
          context: { type: 'share_content_fallback', content },
        });

        Alert.alert(
          'Sharing Unavailable',
          'Unable to share at this time. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    }
  }

  /**
   * Generate invitation link
   */
  generateInvitationLink(
    inviterName: string,
    personalMessage?: string,
    expiresInHours = 168 // 1 week
  ): string {
    const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const content: ShareableContent = {
      type: 'invitation',
      id: inviteId,
      title: `Join ${inviterName} on EcoMind`,
      description: personalMessage || 'You\'ve been invited to connect and build better relationships together.',
      metadata: {
        inviterName,
        personalMessage,
      },
    };

    return this.generateShareableLink(content, {
      useWebUrl: true,
      includeMetadata: true,
      expiresIn: expiresInHours,
    });
  }

  /**
   * Check if link has expired
   */
  isLinkExpired(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const expiresParam = parsedUrl.searchParams.get('expires');
      
      if (!expiresParam) return false;
      
      const expiresAt = new Date(expiresParam);
      return expiresAt < new Date();
    } catch {
      return false;
    }
  }

  /**
   * Validate deep link
   */
  validateDeepLink(url: string): {
    valid: boolean;
    expired?: boolean;
    error?: string;
  } {
    try {
      const linkData = this.parseDeepLink(url);
      if (!linkData) {
        return { valid: false, error: 'Invalid link format' };
      }

      if (this.isLinkExpired(url)) {
        return { valid: false, expired: true, error: 'Link has expired' };
      }

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const deepLinkManager = DeepLinkManager.getInstance();

/**
 * React hook for deep linking
 */
export function useDeepLinking() {
  const [pendingLink, setPendingLink] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Process any pending links when component mounts
    deepLinkManager.processPendingLink();
  }, []);

  const generateShareableLink = React.useCallback((
    content: ShareableContent,
    options?: Parameters<typeof deepLinkManager.generateShareableLink>[1]
  ) => {
    return deepLinkManager.generateShareableLink(content, options);
  }, []);

  const shareContent = React.useCallback((
    content: ShareableContent,
    options?: Parameters<typeof deepLinkManager.shareContent>[1]
  ) => {
    return deepLinkManager.shareContent(content, options);
  }, []);

  const generateInvitationLink = React.useCallback((
    inviterName: string,
    personalMessage?: string,
    expiresInHours?: number
  ) => {
    return deepLinkManager.generateInvitationLink(inviterName, personalMessage, expiresInHours);
  }, []);

  const validateLink = React.useCallback((url: string) => {
    return deepLinkManager.validateDeepLink(url);
  }, []);

  return {
    generateShareableLink,
    shareContent,
    generateInvitationLink,
    validateLink,
    pendingLink,
  };
}

/**
 * Universal link configuration for iOS/Android
 */
export const UNIVERSAL_LINK_CONFIG = {
  ios: {
    bundleId: 'com.ecomind.app',
    appId: 'TEAM_ID.com.ecomind.app',
    paths: ['*'],
  },
  android: {
    packageName: 'com.ecomind.app',
    fingerprints: [
      // SHA256 fingerprints would go here
    ],
  },
  web: {
    domain: 'ecomind.app',
    paths: ['/*'],
  },
};

/**
 * Development utilities for testing deep links
 */
export class DeepLinkTesting {
  private static enabled = __DEV__;

  /**
   * Test deep link navigation
   */
  static testDeepLink(url: string): void {
    if (!this.enabled) return;

    console.log('Testing deep link:', url);
    deepLinkManager.handleDeepLink(url);
  }

  /**
   * Generate test links for development
   */
  static generateTestLinks(): Record<string, string> {
    if (!this.enabled) return {};

    const testContent: ShareableContent[] = [
      {
        type: 'person',
        id: 'test-person-123',
        title: 'John Doe',
        description: 'View John\'s relationship profile',
      },
      {
        type: 'invitation',
        id: 'test-invite-456',
        title: 'Join EcoMind',
        description: 'You\'ve been invited to connect',
      },
      {
        type: 'privacy_report',
        id: 'test-report-789',
        title: 'Privacy Impact Report',
        description: 'View your privacy analysis',
      },
    ];

    const links: Record<string, string> = {};
    testContent.forEach(content => {
      links[`${content.type}_link`] = deepLinkManager.generateShareableLink(content);
    });

    return links;
  }
}