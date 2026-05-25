/**
 * Accessibility attributes generator for React components
 * Generates ARIA attributes, labels, and keyboard navigation support
 */

import { FigmaElement } from '../types/core';

// Accessibility attributes interface
export interface AccessibilityAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-owns'?: string;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-pressed'?: boolean;
  'aria-checked'?: boolean;
  'aria-selected'?: boolean;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  role?: string;
  tabIndex?: number;
  id?: string;
}

// Form accessibility attributes
export interface FormAccessibilityAttributes extends AccessibilityAttributes {
  'aria-errormessage'?: string;
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
  'aria-multiline'?: boolean;
  'aria-placeholder'?: string;
  'aria-readonly'?: boolean;
  'aria-valuemin'?: number;
  'aria-valuemax'?: number;
  'aria-valuenow'?: number;
  'aria-valuetext'?: string;
}

// Element type to accessibility mapping
interface AccessibilityMapping {
  elementType: string;
  defaultRole?: string;
  requiredAttributes: string[];
  optionalAttributes: string[];
  keyboardNavigation: boolean;
  focusable: boolean;
}

// Predefined accessibility mappings for common elements
const ACCESSIBILITY_MAPPINGS: AccessibilityMapping[] = [
  {
    elementType: 'button',
    defaultRole: 'button',
    requiredAttributes: ['aria-label'],
    optionalAttributes: ['aria-describedby', 'aria-pressed', 'aria-expanded', 'aria-haspopup'],
    keyboardNavigation: true,
    focusable: true
  },
  {
    elementType: 'input',
    defaultRole: 'textbox',
    requiredAttributes: ['aria-label'],
    optionalAttributes: ['aria-describedby', 'aria-required', 'aria-invalid', 'aria-errormessage'],
    keyboardNavigation: true,
    focusable: true
  },
  {
    elementType: 'text',
    requiredAttributes: [],
    optionalAttributes: ['aria-label', 'aria-hidden'],
    keyboardNavigation: false,
    focusable: false
  },
  {
    elementType: 'image',
    defaultRole: 'img',
    requiredAttributes: ['aria-label'],
    optionalAttributes: ['aria-describedby', 'aria-hidden'],
    keyboardNavigation: false,
    focusable: false
  },
  {
    elementType: 'frame',
    requiredAttributes: [],
    optionalAttributes: ['aria-label', 'aria-labelledby', 'role'],
    keyboardNavigation: false,
    focusable: false
  },
  {
    elementType: 'component',
    requiredAttributes: [],
    optionalAttributes: ['aria-label', 'aria-labelledby', 'role'],
    keyboardNavigation: false,
    focusable: false
  }
];

export class AccessibilityGenerator {
  private idCounter = 0;

  /**
   * Generate accessibility attributes for a Figma element
   */
  generateAccessibilityAttributes(element: FigmaElement): AccessibilityAttributes {
    const mapping = this.getAccessibilityMapping(element.type);
    const attributes: AccessibilityAttributes = {};

    // Generate required attributes
    mapping.requiredAttributes.forEach(attr => {
      const value = this.generateAttributeValue(attr, element);
      if (value !== null) {
        (attributes as any)[attr] = value;
      }
    });

    // Add optional aria-describedby if element has description
    if (this.hasDescriptionText(element)) {
      const describedBy = this.generateAriaDescribedBy(element);
      if (describedBy) {
        attributes['aria-describedby'] = describedBy;
      }
    }

    // Add default role if specified
    if (mapping.defaultRole) {
      attributes.role = mapping.defaultRole;
    }

    // Add tabIndex for all elements (focusable get 0, non-focusable get -1)
    attributes.tabIndex = this.generateTabIndex(element);

    // Generate ID if needed for labeling
    if (this.needsId(element)) {
      attributes.id = this.generateId(element);
    }

    // Add interactive element specific attributes
    if (this.isInteractiveElement(element)) {
      this.addInteractiveAttributes(attributes, element);
    }

    // Add form element specific attributes
    if (this.isFormElement(element)) {
      this.addFormAttributes(attributes as FormAccessibilityAttributes, element);
    }

    return attributes;
  }

  /**
   * Generate form accessibility attributes
   */
  generateFormAccessibilityAttributes(element: FigmaElement): FormAccessibilityAttributes {
    const baseAttributes = this.generateAccessibilityAttributes(element);
    const formAttributes: FormAccessibilityAttributes = { ...baseAttributes };

    // Add form-specific attributes
    if (element.type === 'input') {
      // Add required attribute if element name suggests it's required
      if (this.isRequiredField(element)) {
        formAttributes['aria-required'] = true;
      }

      // Add autocomplete if applicable
      const autocomplete = this.getAutocompleteValue(element);
      if (autocomplete) {
        formAttributes['aria-autocomplete'] = autocomplete;
      }

      // Add placeholder as aria-placeholder
      const placeholder = this.getPlaceholderText(element);
      if (placeholder) {
        formAttributes['aria-placeholder'] = placeholder;
      }
    }

    return formAttributes;
  }

  /**
   * Generate keyboard navigation attributes
   */
  generateKeyboardNavigationAttributes(element: FigmaElement): Partial<AccessibilityAttributes> {
    const mapping = this.getAccessibilityMapping(element.type);
    const attributes: Partial<AccessibilityAttributes> = {};

    if (mapping.keyboardNavigation) {
      // Set appropriate tabIndex
      attributes.tabIndex = this.generateTabIndex(element);

      // Add keyboard event handlers (these will be added to the JSX)
      if (element.type === 'button') {
        // Button elements need Enter and Space key support
        // This will be handled in the JSX generator
      }
    }

    return attributes;
  }

  /**
   * Generate validation message attributes
   */
  generateValidationAttributes(element: FigmaElement, hasError: boolean = false): Partial<FormAccessibilityAttributes> {
    const attributes: Partial<FormAccessibilityAttributes> = {};

    if (this.isFormElement(element)) {
      if (hasError) {
        attributes['aria-invalid'] = true;
        attributes['aria-errormessage'] = `${this.generateId(element)}-error`;
      }

      // Add live region for dynamic validation messages
      if (this.needsLiveRegion(element)) {
        attributes['aria-live'] = 'polite';
        attributes['aria-atomic'] = true;
      }
    }

    return attributes;
  }

  /**
   * Get accessibility mapping for element type
   */
  private getAccessibilityMapping(elementType: string): AccessibilityMapping {
    return ACCESSIBILITY_MAPPINGS.find(mapping => mapping.elementType === elementType) || {
      elementType: 'unknown',
      requiredAttributes: [],
      optionalAttributes: ['aria-label'],
      keyboardNavigation: false,
      focusable: false
    };
  }

  /**
   * Generate value for specific accessibility attribute
   */
  private generateAttributeValue(attribute: string, element: FigmaElement): string | boolean | number | null {
    switch (attribute) {
      case 'aria-label':
        return this.generateAriaLabel(element);
      case 'aria-describedby':
        const describedBy = this.generateAriaDescribedBy(element);
        return describedBy; // Can be null
      case 'aria-required':
        return this.isRequiredField(element);
      case 'aria-invalid':
        return false; // Default to false, will be updated based on validation state
      default:
        return null;
    }
  }

  /**
   * Generate aria-label for element
   */
  private generateAriaLabel(element: FigmaElement): string {
    // Use element name as base for aria-label
    let label = element.name || element.properties.name;

    // Clean up the label
    label = label.replace(/[_-]/g, ' ').trim();
    
    // Capitalize first letter
    label = label.charAt(0).toUpperCase() + label.slice(1);

    // Add context based on element type
    switch (element.type) {
      case 'button':
        if (!label.toLowerCase().includes('button')) {
          label += ' button';
        }
        break;
      case 'input':
        if (!label.toLowerCase().includes('input') && !label.toLowerCase().includes('field')) {
          label += ' input';
        }
        break;
      case 'image':
        if (!label.toLowerCase().includes('image') && !label.toLowerCase().includes('icon')) {
          label += ' image';
        }
        break;
    }

    return label;
  }

  /**
   * Generate aria-describedby for element
   */
  private generateAriaDescribedBy(element: FigmaElement): string | null {
    // Generate describedby ID if element has description or help text
    if (this.hasDescriptionText(element)) {
      return `${this.generateId(element)}-description`;
    }
    return null;
  }

  /**
   * Generate tabIndex for element
   */
  private generateTabIndex(element: FigmaElement): number {
    const mapping = this.getAccessibilityMapping(element.type);
    
    if (!mapping.focusable) {
      return -1; // Not focusable
    }

    // Interactive elements should be in tab order
    if (this.isInteractiveElement(element)) {
      return 0; // Natural tab order
    }

    return -1; // Not in tab order by default
  }

  /**
   * Generate unique ID for element
   */
  private generateId(element: FigmaElement): string {
    const baseName = element.name || element.properties.name || 'element';
    const cleanName = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${cleanName}-${++this.idCounter}`;
  }

  /**
   * Check if element needs an ID
   */
  private needsId(element: FigmaElement): boolean {
    return this.isFormElement(element) || 
           this.hasDescriptionText(element) || 
           this.isInteractiveElement(element);
  }

  /**
   * Check if element is interactive
   */
  private isInteractiveElement(element: FigmaElement): boolean {
    return ['button', 'input'].includes(element.type);
  }

  /**
   * Check if element is a form element
   */
  private isFormElement(element: FigmaElement): boolean {
    return element.type === 'input';
  }

  /**
   * Check if field is required
   */
  private isRequiredField(element: FigmaElement): boolean {
    const name = (element.name || element.properties.name || '').toLowerCase();
    return name.includes('required') || 
           name.includes('*') || 
           name.includes('mandatory');
  }

  /**
   * Get autocomplete value for input
   */
  private getAutocompleteValue(element: FigmaElement): 'none' | 'inline' | 'list' | 'both' | null {
    const name = (element.name || element.properties.name || '').toLowerCase();
    
    if (name.includes('search')) {
      return 'list';
    }
    
    if (name.includes('email') || name.includes('name') || name.includes('address')) {
      return 'inline';
    }
    
    return null;
  }

  /**
   * Get placeholder text for input
   */
  private getPlaceholderText(element: FigmaElement): string | null {
    // This would typically come from Figma text content or properties
    // For now, generate based on element name
    const name = (element.name || element.properties.name || '').toLowerCase();
    
    if (name.includes('email')) {
      return 'Enter your email address';
    }
    
    if (name.includes('password')) {
      return 'Enter your password';
    }
    
    if (name.includes('search')) {
      return 'Search...';
    }
    
    return null;
  }

  /**
   * Check if element has description text
   */
  private hasDescriptionText(element: FigmaElement): boolean {
    // This would check if there's associated description text in Figma
    // For now, assume elements with certain names have descriptions
    const name = (element.name || element.properties.name || '').toLowerCase();
    return name.includes('help') || name.includes('description') || name.includes('info');
  }

  /**
   * Add interactive element specific attributes
   */
  private addInteractiveAttributes(attributes: AccessibilityAttributes, element: FigmaElement): void {
    if (element.type === 'button') {
      // Add pressed state for toggle buttons
      if (this.isToggleButton(element)) {
        attributes['aria-pressed'] = false; // Default state
      }
      
      // Add expanded state for dropdown buttons
      if (this.isDropdownButton(element)) {
        attributes['aria-expanded'] = false; // Default state
        attributes['aria-haspopup'] = true;
      }
    }
  }

  /**
   * Add form element specific attributes
   */
  private addFormAttributes(attributes: FormAccessibilityAttributes, element: FigmaElement): void {
    if (element.type === 'input') {
      // Add multiline for textarea-like inputs
      if (this.isMultilineInput(element)) {
        attributes['aria-multiline'] = true;
      }
      
      // Add readonly if applicable
      if (this.isReadonlyInput(element)) {
        attributes['aria-readonly'] = true;
      }
    }
  }

  /**
   * Check if element needs live region
   */
  private needsLiveRegion(element: FigmaElement): boolean {
    // Form elements that show dynamic validation messages need live regions
    return this.isFormElement(element);
  }

  /**
   * Check if button is a toggle button
   */
  private isToggleButton(element: FigmaElement): boolean {
    const name = (element.name || element.properties.name || '').toLowerCase();
    return name.includes('toggle') || name.includes('switch');
  }

  /**
   * Check if button is a dropdown button
   */
  private isDropdownButton(element: FigmaElement): boolean {
    const name = (element.name || element.properties.name || '').toLowerCase();
    return name.includes('dropdown') || name.includes('menu') || name.includes('select');
  }

  /**
   * Check if input is multiline
   */
  private isMultilineInput(element: FigmaElement): boolean {
    const name = (element.name || element.properties.name || '').toLowerCase();
    return name.includes('textarea') || name.includes('multiline') || 
           (element.properties.height > 60); // Assume tall inputs are multiline
  }

  /**
   * Check if input is readonly
   */
  private isReadonlyInput(element: FigmaElement): boolean {
    const name = (element.name || element.properties.name || '').toLowerCase();
    return name.includes('readonly') || name.includes('disabled');
  }
}