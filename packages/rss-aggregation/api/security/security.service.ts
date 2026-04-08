import { Service, Logger, Config } from "@cmmv/core";
import validator from "validator";

export interface SecurityWarning {
  type: 'xml_parsing' | 'html_content' | 'url_validation' | 'ai_prompt' | 'memory_usage';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface SecurityValidationResult {
  isValid: boolean;
  warnings: SecurityWarning[];
  sanitizedData?: any;
}

@Service()
export class SecurityService {
  private readonly logger = new Logger("SecurityService");

  constructor() {
    this.logger.log('SecurityService initialized');
  }

  /**
   * Validate XML input for security issues
   * @param xml - XML content to validate
   * @param source - Source identifier (URL, channel name, etc.)
   * @returns Validation result with warnings
   */
  validateXmlInput(xml: string, source: string): SecurityValidationResult {
    const warnings: SecurityWarning[] = [];
    let isValid = true;

    // Check XML size (configurable, default 10MB)
    const maxSizeMB = Config.get("security.xml.maxSizeMB", 10);
    const sizeMB = Buffer.byteLength(xml, 'utf8') / (1024 * 1024);

    if (sizeMB > maxSizeMB) {
      warnings.push(this.createWarning(
        'xml_parsing',
        'high',
        `XML content exceeds size limit: ${sizeMB.toFixed(2)}MB > ${maxSizeMB}MB`,
        { source, sizeMB, maxSizeMB }
      ));
    }

    // Check for basic XML structure
    if (!xml.trim().startsWith('<?xml') && !xml.trim().startsWith('<rss') && !xml.trim().startsWith('<feed')) {
      warnings.push(this.createWarning(
        'xml_parsing',
        'medium',
        'XML content missing XML declaration or RSS/Atom root element',
        { source, first100Chars: xml.substring(0, 100) }
      ));
    }

    // Check for potential XXE indicators
    const xxeIndicators = [
      '<!ENTITY',
      'SYSTEM',
      'PUBLIC',
      '%',
      '&'
    ];

    for (const indicator of xxeIndicators) {
      if (xml.includes(indicator)) {
        warnings.push(this.createWarning(
          'xml_parsing',
          'high',
          `XML contains potential XXE indicator: ${indicator}`,
          { source, indicator }
        ));
        break;
      }
    }

    return {
      isValid,
      warnings
    };
  }

  /**
   * Validate HTML content for security issues
   * @param html - HTML content to validate
   * @param context - Context identifier (parser, channel, etc.)
   * @returns Validation result with warnings
   */
  validateHtmlContent(html: string, context: string): SecurityValidationResult {
    const warnings: SecurityWarning[] = [];
    let isValid = true;

    if (!html || typeof html !== 'string') {
      return {
        isValid: false,
        warnings: [this.createWarning(
          'html_content',
          'medium',
          'HTML content is empty or not a string',
          { context }
        )]
      };
    }

    // Check for script tags
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    const scriptMatches = [...html.matchAll(scriptRegex)];

    if (scriptMatches.length > 0) {
      warnings.push(this.createWarning(
        'html_content',
        'high',
        `HTML contains ${scriptMatches.length} script tag(s)`,
        { context, scriptCount: scriptMatches.length }
      ));
    }

    // Check for inline event handlers
    const eventHandlerRegex = /\bon\w+\s*=\s*["'][^"']*["']/gi;
    const eventMatches = [...html.matchAll(eventHandlerRegex)];

    if (eventMatches.length > 0) {
      warnings.push(this.createWarning(
        'html_content',
        'high',
        `HTML contains ${eventMatches.length} inline event handler(s)`,
        { context, eventCount: eventMatches.length }
      ));
    }

    // Check for javascript: URLs
    const jsUrlRegex = /(href|src)\s*=\s*["']\s*javascript:/gi;
    const jsUrlMatches = [...html.matchAll(jsUrlRegex)];

    if (jsUrlMatches.length > 0) {
      warnings.push(this.createWarning(
        'html_content',
        'high',
        `HTML contains ${jsUrlMatches.length} javascript: URL(s)`,
        { context, jsUrlCount: jsUrlMatches.length }
      ));
    }

    // Check for data: URLs (potential for large data URIs)
    const dataUrlRegex = /(src|href)\s*=\s*["']\s*data:/gi;
    const dataUrlMatches = [...html.matchAll(dataUrlRegex)];

    if (dataUrlMatches.length > 0) {
      warnings.push(this.createWarning(
        'html_content',
        'medium',
        `HTML contains ${dataUrlMatches.length} data: URL(s)`,
        { context, dataUrlCount: dataUrlMatches.length }
      ));
    }

    return {
      isValid,
      warnings
    };
  }

  /**
   * Validate URL for security issues
   * @param url - URL to validate
   * @param context - Context identifier (link, image, video, etc.)
   * @returns Validation result with warnings
   */
  validateUrl(url: string, context: string): SecurityValidationResult {
    const warnings: SecurityWarning[] = [];
    let isValid = true;

    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        warnings: [this.createWarning(
          'url_validation',
          'medium',
          'URL is empty or not a string',
          { context }
        )]
      };
    }

    // Check URL length (max 2048 characters, configurable)
    const maxUrlLength = Config.get("security.url.maxLength", 2048);
    if (url.length > maxUrlLength) {
      warnings.push(this.createWarning(
        'url_validation',
        'high',
        `URL exceeds maximum length: ${url.length} > ${maxUrlLength} characters`,
        { context, urlLength: url.length, maxUrlLength }
      ));
    }

    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
    const lowerUrl = url.toLowerCase();

    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        warnings.push(this.createWarning(
          'url_validation',
          'high',
          `URL uses dangerous protocol: ${protocol}`,
          { context, protocol, url: url.substring(0, 100) }
        ));
        isValid = false;
        break;
      }
    }

    // Check for common XSS patterns in URLs
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /alert\s*\(/i,
      /document\./i,
      /window\./i
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(url)) {
        warnings.push(this.createWarning(
          'url_validation',
          'high',
          `URL contains potential XSS pattern: ${pattern.toString()}`,
          { context, pattern: pattern.toString(), url: url.substring(0, 100) }
        ));
        break;
      }
    }

    // Check for encoded characters that might bypass validation
    const encodedPatterns = [
      /%3Cscript/i,  // <script
      /%3E/i,        // >
      /%22/i,        // "
      /%27/i,        // '
      /%28/i,        // (
      /%29/i         // )
    ];

    for (const pattern of encodedPatterns) {
      if (pattern.test(url)) {
        warnings.push(this.createWarning(
          'url_validation',
          'medium',
          `URL contains encoded characters that might indicate evasion attempt`,
          { context, pattern: pattern.toString(), url: url.substring(0, 100) }
        ));
        break;
      }
    }

    // Validate URL format using validator.js
    try {
      // Check if URL is valid format
      if (!validator.isURL(url, {
        require_protocol: true,
        require_valid_protocol: true,
        protocols: ['http', 'https'],
        require_host: true,
        require_tld: false // Allow IP addresses and localhost
      })) {
        warnings.push(this.createWarning(
          'url_validation',
          'medium',
          `URL format is invalid according to validator.js`,
          { context, url: url.substring(0, 100) }
        ));
      }

      // Check domain/FQDN using validator.js
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      if (!validator.isFQDN(hostname) && !validator.isIP(hostname)) {
        warnings.push(this.createWarning(
          'url_validation',
          'medium',
          `URL hostname is not a valid FQDN or IP address`,
          { context, hostname }
        ));
      }

      // Check scheme (protocol) - only http/https allowed
      const scheme = urlObj.protocol.slice(0, -1).toLowerCase();
      if (scheme !== 'http' && scheme !== 'https') {
        warnings.push(this.createWarning(
          'url_validation',
          'high',
          `URL uses non-HTTP/HTTPS protocol: ${scheme}`,
          { context, scheme, url: url.substring(0, 100) }
        ));
      }

    } catch (error) {
      warnings.push(this.createWarning(
        'url_validation',
        'high',
        `URL parsing failed: ${error instanceof Error ? error.message : String(error)}`,
        { context, error: String(error), url: url.substring(0, 100) }
      ));
    }

    return {
      isValid,
      warnings
    };
  }

  /**
   * Validate AI prompt for security issues
   * @param prompt - AI prompt to validate
   * @returns Validation result with warnings
   */
  validateAiPrompt(prompt: string): SecurityValidationResult {
    const warnings: SecurityWarning[] = [];
    let isValid = true;

    if (!prompt || typeof prompt !== 'string') {
      return {
        isValid: false,
        warnings: [this.createWarning(
          'ai_prompt',
          'medium',
          'AI prompt is empty or not a string',
          {}
        )]
      };
    }

    // Check prompt length (reasonable limit, configurable)
    const maxPromptLength = Config.get("security.ai.maxPromptLength", 10000);
    if (prompt.length > maxPromptLength) {
      warnings.push(this.createWarning(
        'ai_prompt',
        'medium',
        `AI prompt exceeds maximum length: ${prompt.length} > ${maxPromptLength} characters`,
        { promptLength: prompt.length, maxPromptLength }
      ));
    }

    // Check for potential prompt injection patterns
    const injectionPatterns = [
      /ignore previous/i,
      /system prompt/i,
      /override/i,
      /disregard/i,
      /as an AI/i,
      /as a language model/i,
      /you are now/i,
      /you must/i,
      /you should/i,
      /output only/i,
      /forget everything/i
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(prompt)) {
        warnings.push(this.createWarning(
          'ai_prompt',
          'high',
          `AI prompt contains potential injection pattern: ${pattern.toString()}`,
          { pattern: pattern.toString() }
        ));
        break;
      }
    }

    // Check for sensitive data patterns
    const sensitivePatterns = [
      /password\s*[:=]/i,
      /secret\s*[:=]/i,
      /api.?key/i,
      /token\s*[:=]/i,
      /credit.?card/i,
      /ssn|social security/i,
      /personal identification/i
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(prompt)) {
        warnings.push(this.createWarning(
          'ai_prompt',
          'high',
          `AI prompt contains potential sensitive data pattern: ${pattern.toString()}`,
          { pattern: pattern.toString() }
        ));
        break;
      }
    }

    return {
      isValid,
      warnings
    };
  }

  /**
   * Validate JSON input for security issues
   * @param json - JSON string or object to validate
   * @param context - Context identifier (endpoint name, etc.)
   * @returns Validation result with warnings
   */
  validateJson(json: any, context: string): SecurityValidationResult {
    const warnings: SecurityWarning[] = [];
    let isValid = true;

    if (!json) {
      return {
        isValid: false,
        warnings: [this.createWarning(
          'url_validation',
          'medium',
          'JSON input is empty',
          { context }
        )]
      };
    }

    // Check size if it's a string
    if (typeof json === 'string') {
      const maxJsonSize = Config.get("security.json.maxSize", 1048576); // 1MB default
      if (json.length > maxJsonSize) {
        warnings.push(this.createWarning(
          'html_content',
          'medium',
          `JSON input exceeds maximum size: ${json.length} > ${maxJsonSize} characters`,
          { context, jsonSize: json.length, maxJsonSize }
        ));
      }

      // Try to parse and check for potential JSON injection patterns
      try {
        const parsed = JSON.parse(json);
        return this.validateJsonObject(parsed, context);
      } catch (error) {
        warnings.push(this.createWarning(
          'html_content',
          'medium',
          `JSON parsing failed: ${error instanceof Error ? error.message : String(error)}`,
          { context, error: String(error) }
        ));
      }
    } else {
      // Already an object
      return this.validateJsonObject(json, context);
    }

    return {
      isValid,
      warnings
    };
  }

  /**
   * Validate JSON object for security issues
   * @param obj - JSON object to validate
   * @param context - Context identifier
   * @returns Validation result with warnings
   */
  private validateJsonObject(obj: any, context: string): SecurityValidationResult {
    const warnings: SecurityWarning[] = [];
    let isValid = true;

    // Check for nested depth
    const maxDepth = Config.get("security.json.maxDepth", 10);
    const depth = this.getObjectDepth(obj);
    if (depth > maxDepth) {
      warnings.push(this.createWarning(
        'html_content',
        'medium',
        `JSON object exceeds maximum nesting depth: ${depth} > ${maxDepth}`,
        { context, depth, maxDepth }
      ));
    }

    // Check for large arrays
    const maxArraySize = Config.get("security.json.maxArraySize", 1000);
    const arraySize = this.getLargestArraySize(obj);
    if (arraySize > maxArraySize) {
      warnings.push(this.createWarning(
        'html_content',
        'medium',
        `JSON contains large array: ${arraySize} > ${maxArraySize} items`,
        { context, arraySize, maxArraySize }
      ));
    }

    // Check for potential injection patterns in string values
    this.scanObjectForInjectionPatterns(obj, context, warnings);

    return {
      isValid,
      warnings
    };
  }

  /**
   * Calculate object nesting depth
   */
  private getObjectDepth(obj: any): number {
    if (!obj || typeof obj !== 'object') return 0;

    let depth = 0;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const childDepth = this.getObjectDepth(obj[key]);
        depth = Math.max(depth, childDepth + 1);
      }
    }
    return depth;
  }

  /**
   * Get size of largest array in object
   */
  private getLargestArraySize(obj: any): number {
    if (!obj || typeof obj !== 'object') return 0;

    let maxSize = 0;

    if (Array.isArray(obj)) {
      maxSize = obj.length;
      for (const item of obj) {
        maxSize = Math.max(maxSize, this.getLargestArraySize(item));
      }
    } else {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          maxSize = Math.max(maxSize, this.getLargestArraySize(obj[key]));
        }
      }
    }

    return maxSize;
  }

  /**
   * Scan object for potential injection patterns
   */
  private scanObjectForInjectionPatterns(obj: any, context: string, warnings: SecurityWarning[]): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.scanObjectForInjectionPatterns(item, context, warnings);
      }
    } else {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];

          if (typeof value === 'string') {
            // Check for XSS patterns in string values
            const xssPatterns = [
              /<script/i,
              /javascript:/i,
              /on\w+\s*=/i,
              /eval\s*\(/i,
              /alert\s*\(/i
            ];

            for (const pattern of xssPatterns) {
              if (pattern.test(value)) {
                warnings.push(this.createWarning(
                  'html_content',
                  'high',
                  `JSON contains potential XSS pattern in field '${key}': ${pattern.toString()}`,
                  { context, field: key, pattern: pattern.toString(), value: value.substring(0, 100) }
                ));
                break;
              }
            }
          } else if (typeof value === 'object') {
            this.scanObjectForInjectionPatterns(value, context, warnings);
          }
        }
      }
    }
  }

  /**
   * Validate request body for security issues
   * @param body - Request body (any type)
   * @param context - Context identifier (endpoint name)
   * @returns Validation result with warnings
   */
  validateRequestBody(body: any, context: string): SecurityValidationResult {
    const warnings: SecurityWarning[] = [];
    let isValid = true;

    if (!body) {
      return {
        isValid: true, // Empty body is valid
        warnings: []
      };
    }

    // Check body size
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    const maxBodySize = Config.get("security.request.maxBodySize", 5242880); // 5MB default
    if (bodyString.length > maxBodySize) {
      warnings.push(this.createWarning(
        'html_content',
        'high',
        `Request body exceeds maximum size: ${bodyString.length} > ${maxBodySize} characters`,
        { context, bodySize: bodyString.length, maxBodySize }
      ));
    }

    // Validate as JSON if it's an object or string
    if (typeof body === 'object' || typeof body === 'string') {
      const jsonResult = this.validateJson(body, context);
      warnings.push(...jsonResult.warnings);
      if (!jsonResult.isValid) {
        isValid = false;
      }
    }

    return {
      isValid,
      warnings
    };
  }

  /**
   * Log security warnings
   * @param warnings - Array of security warnings to log
   */
  logWarnings(warnings: SecurityWarning[]): void {
    for (const warning of warnings) {
      switch (warning.severity) {
        case 'high':
          this.logger.log(`HIGH severity security warning: ${warning.message}`, warning.details);
          break;
        case 'medium':
          this.logger.log(`MEDIUM severity security warning: ${warning.message}`, warning.details);
          break;
        case 'low':
          this.logger.log(`LOW severity security warning: ${warning.message}`, warning.details);
          break;
      }
    }
  }

  /**
   * Create a standardized security warning
   */
  private createWarning(
    type: SecurityWarning['type'],
    severity: SecurityWarning['severity'],
    message: string,
    details: Record<string, any>
  ): SecurityWarning {
    return {
      type,
      severity,
      message,
      details,
      timestamp: new Date()
    };
  }
}