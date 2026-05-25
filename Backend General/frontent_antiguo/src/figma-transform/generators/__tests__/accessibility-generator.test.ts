/**
 * Tests for AccessibilityGenerator
 */

import { AccessibilityGenerator } from '../accessibility-generator';
import { FigmaElement } from '../../types/core';

describe('AccessibilityGenerator', () => {
  let generator: AccessibilityGenerator;

  beforeEach(() => {
    generator = new AccessibilityGenerator();
  });

  describe('generateAccessibilityAttributes', () => {
    it('should generate aria-label for button elements', () => {
      const buttonElement: FigmaElement = {
        id: 'btn-1',
        type: 'button',
        name: 'submit-button',
        properties: {
          name: 'submit-button',
          width: 120,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const attributes = generator.generateAccessibilityAttributes(buttonElement);

      expect(attributes['aria-label']).toBe('Submit button');
      expect(attributes.role).toBe('button');
      expect(attributes.tabIndex).toBe(0);
      expect(attributes.id).toBeDefined();
    });

    it('should generate aria-label for input elements', () => {
      const inputElement: FigmaElement = {
        id: 'input-1',
        type: 'input',
        name: 'email-input',
        properties: {
          name: 'email-input',
          width: 200,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const attributes = generator.generateAccessibilityAttributes(inputElement);

      expect(attributes['aria-label']).toBe('Email input');
      expect(attributes.role).toBe('textbox');
      expect(attributes.tabIndex).toBe(0);
    });

    it('should not add tabIndex for non-interactive elements', () => {
      const textElement: FigmaElement = {
        id: 'text-1',
        type: 'text',
        name: 'heading-text',
        properties: {
          name: 'heading-text',
          width: 200,
          height: 30,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const attributes = generator.generateAccessibilityAttributes(textElement);

      expect(attributes.tabIndex).toBe(-1);
      expect(attributes.role).toBeUndefined();
    });

    it('should generate aria-describedby when element has description', () => {
      const buttonElement: FigmaElement = {
        id: 'btn-help',
        type: 'button',
        name: 'help-button',
        properties: {
          name: 'help-button',
          width: 120,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const attributes = generator.generateAccessibilityAttributes(buttonElement);

      expect(attributes['aria-describedby']).toBe('help-button-1-description');
    });
  });

  describe('generateFormAccessibilityAttributes', () => {
    it('should add required attribute for required fields', () => {
      const requiredInput: FigmaElement = {
        id: 'input-required',
        type: 'input',
        name: 'required-email',
        properties: {
          name: 'required-email',
          width: 200,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const attributes = generator.generateFormAccessibilityAttributes(requiredInput);

      expect(attributes['aria-required']).toBe(true);
    });

    it('should add autocomplete for email inputs', () => {
      const emailInput: FigmaElement = {
        id: 'input-email',
        type: 'input',
        name: 'email-field',
        properties: {
          name: 'email-field',
          width: 200,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const attributes = generator.generateFormAccessibilityAttributes(emailInput);

      expect(attributes['aria-autocomplete']).toBe('inline');
      expect(attributes['aria-placeholder']).toBe('Enter your email address');
    });

    it('should add autocomplete for search inputs', () => {
      const searchInput: FigmaElement = {
        id: 'input-search',
        type: 'input',
        name: 'search-box',
        properties: {
          name: 'search-box',
          width: 300,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const attributes = generator.generateFormAccessibilityAttributes(searchInput);

      expect(attributes['aria-autocomplete']).toBe('list');
      expect(attributes['aria-placeholder']).toBe('Search...');
    });
  });

  describe('generateKeyboardNavigationAttributes', () => {
    it('should set tabIndex 0 for interactive elements', () => {
      const buttonElement: FigmaElement = {
        id: 'btn-1',
        type: 'button',
        name: 'click-me',
        properties: {
          name: 'click-me',
          width: 120,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const attributes = generator.generateKeyboardNavigationAttributes(buttonElement);

      expect(attributes.tabIndex).toBe(0);
    });

    it('should not set tabIndex for non-interactive elements', () => {
      const imageElement: FigmaElement = {
        id: 'img-1',
        type: 'image',
        name: 'logo',
        properties: {
          name: 'logo',
          width: 100,
          height: 50,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const attributes = generator.generateKeyboardNavigationAttributes(imageElement);

      expect(attributes.tabIndex).toBeUndefined();
    });
  });

  describe('generateValidationAttributes', () => {
    it('should add aria-invalid when element has error', () => {
      const inputElement: FigmaElement = {
        id: 'input-1',
        type: 'input',
        name: 'email-input',
        properties: {
          name: 'email-input',
          width: 200,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const attributes = generator.generateValidationAttributes(inputElement, true);

      expect(attributes['aria-invalid']).toBe(true);
      expect(attributes['aria-errormessage']).toBe('email-input-1-error');
    });

    it('should add live region for form elements', () => {
      const inputElement: FigmaElement = {
        id: 'input-1',
        type: 'input',
        name: 'username',
        properties: {
          name: 'username',
          width: 200,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const attributes = generator.generateValidationAttributes(inputElement);

      expect(attributes['aria-live']).toBe('polite');
      expect(attributes['aria-atomic']).toBe(true);
    });
  });

  describe('special button types', () => {
    it('should add aria-pressed for toggle buttons', () => {
      const toggleButton: FigmaElement = {
        id: 'btn-toggle',
        type: 'button',
        name: 'toggle-button',
        properties: {
          name: 'toggle-button',
          width: 120,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const attributes = generator.generateAccessibilityAttributes(toggleButton);

      expect(attributes['aria-pressed']).toBe(false);
    });

    it('should add aria-expanded and aria-haspopup for dropdown buttons', () => {
      const dropdownButton: FigmaElement = {
        id: 'btn-dropdown',
        type: 'button',
        name: 'dropdown-menu',
        properties: {
          name: 'dropdown-menu',
          width: 120,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const attributes = generator.generateAccessibilityAttributes(dropdownButton);

      expect(attributes['aria-expanded']).toBe(false);
      expect(attributes['aria-haspopup']).toBe(true);
    });
  });

  describe('multiline inputs', () => {
    it('should add aria-multiline for tall inputs', () => {
      const textareaInput: FigmaElement = {
        id: 'input-textarea',
        type: 'input',
        name: 'message-textarea',
        properties: {
          name: 'message-textarea',
          width: 300,
          height: 120, // Tall input suggests multiline
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const attributes = generator.generateFormAccessibilityAttributes(textareaInput);

      expect(attributes['aria-multiline']).toBe(true);
    });

    it('should add aria-readonly for readonly inputs', () => {
      const readonlyInput: FigmaElement = {
        id: 'input-readonly',
        type: 'input',
        name: 'readonly-field',
        properties: {
          name: 'readonly-field',
          width: 200,
          height: 40,
          x: 0,
          y: 0,
          visible: true,
          constraints: { horizontal: 'LEFT', vertical: 'TOP' }
        },
        styles: {}
      };

      const attributes = generator.generateFormAccessibilityAttributes(readonlyInput);

      expect(attributes['aria-readonly']).toBe(true);
    });
  });
});