import { describe, it, expect } from 'vitest';
import * as helpers from '../../utils/helpers';

describe('Helper Utilities', () => {

  describe('String Utilities', () => {
    
    it('should capitalize string', () => {
      expect(helpers.capitalize('hello')).toBe('Hello');
      expect(helpers.capitalize('WORLD')).toBe('World');
    });

    it('should convert to slug', () => {
      expect(helpers.toSlug('Hello World')).toBe('hello-world');
      expect(helpers.toSlug('Test Case 123')).toBe('test-case-123');
    });

    it('should truncate string', () => {
      const longString = 'This is a very long string that needs truncation';
      const result = helpers.truncateString(longString, 20);
      expect(result.length).toBeLessThanOrEqual(23); // includes '...'
      expect(result).toContain('...');
    });

    it('should format phone number', () => {
      expect(helpers.formatPhoneNumber('9999999999')).toBe('+91-9999999999');
      expect(helpers.formatPhoneNumber('919999999999')).toBe('+91-9999999999');
    });

    it('should validate email', () => {
      expect(helpers.isValidEmail('test@example.com')).toBe(true);
      expect(helpers.isValidEmail('invalid-email')).toBe(false);
      expect(helpers.isValidEmail('test@.com')).toBe(false);
    });

    it('should validate password strength', () => {
      expect(helpers.isStrongPassword('WeakPass')).toBe(false);
      expect(helpers.isStrongPassword('StrongPass123!@#')).toBe(true);
      expect(helpers.isStrongPassword('short')).toBe(false);
    });
  });

  describe('Number Utilities', () => {
    
    it('should format currency', () => {
      expect(helpers.formatCurrency(1000)).toBe('₹1,000.00');
      expect(helpers.formatCurrency(1000000)).toBe('₹10,00,000.00');
    });

    it('should round number to decimal places', () => {
      expect(helpers.roundToDecimal(3.14159, 2)).toBe(3.14);
      expect(helpers.roundToDecimal(3.14159, 3)).toBe(3.142);
    });

    it('should convert bytes to readable format', () => {
      expect(helpers.formatBytes(1024)).toBe('1.00 KB');
      expect(helpers.formatBytes(1048576)).toBe('1.00 MB');
      expect(helpers.formatBytes(1073741824)).toBe('1.00 GB');
    });

    it('should calculate percentage', () => {
      expect(helpers.calculatePercentage(50, 100)).toBe(50);
      expect(helpers.calculatePercentage(25, 200)).toBe(12.5);
    });

    it('should generate random number between range', () => {
      const random = helpers.getRandomNumber(1, 10);
      expect(random).toBeGreaterThanOrEqual(1);
      expect(random).toBeLessThanOrEqual(10);
    });
  });

  describe('Date Utilities', () => {
    
    it('should format date to readable string', () => {
      const date = new Date('2024-02-08');
      const formatted = helpers.formatDate(date);
      expect(formatted).toContain('2024');
      expect(formatted).toContain('Feb');
    });

    it('should format date to specific format', () => {
      const date = new Date('2024-02-08');
      const formatted = helpers.formatDateCustom(date, 'DD/MM/YYYY');
      expect(formatted).toBe('08/02/2024');
    });

    it('should get time ago string', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
      expect(helpers.getTimeAgo(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    it('should calculate days between dates', () => {
      const date1 = new Date('2024-02-01');
      const date2 = new Date('2024-02-08');
      expect(helpers.daysBetween(date1, date2)).toBe(7);
    });

    it('should check if date is today', () => {
      const today = new Date();
      const yesterday = new Date(today - 1000 * 60 * 60 * 24);
      expect(helpers.isToday(today)).toBe(true);
      expect(helpers.isToday(yesterday)).toBe(false);
    });

    it('should check if date is past', () => {
      const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 24);
      const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24);
      expect(helpers.isPast(yesterday)).toBe(true);
      expect(helpers.isPast(tomorrow)).toBe(false);
    });
  });

  describe('Array Utilities', () => {
    
    it('should remove duplicates from array', () => {
      const arr = [1, 2, 2, 3, 3, 3, 4];
      expect(helpers.removeDuplicates(arr)).toEqual([1, 2, 3, 4]);
    });

    it('should chunk array into smaller arrays', () => {
      const arr = [1, 2, 3, 4, 5, 6];
      const chunked = helpers.chunkArray(arr, 2);
      expect(chunked).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    it('should flatten nested array', () => {
      const nested = [1, [2, 3], [4, [5, 6]]];
      expect(helpers.flattenArray(nested)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should sort array of objects', () => {
      const arr = [
        { id: 3, name: 'C' },
        { id: 1, name: 'A' },
        { id: 2, name: 'B' }
      ];
      const sorted = helpers.sortByKey(arr, 'id');
      expect(sorted[0].id).toBe(1);
      expect(sorted[2].id).toBe(3);
    });

    it('should filter array by key-value', () => {
      const arr = [
        { type: 'flood', risk: 0.8 },
        { type: 'earthquake', risk: 0.6 },
        { type: 'flood', risk: 0.9 }
      ];
      const filtered = helpers.filterByKey(arr, 'type', 'flood');
      expect(filtered).toHaveLength(2);
    });

    it('should group array by key', () => {
      const arr = [
        { type: 'flood', id: 1 },
        { type: 'flood', id: 2 },
        { type: 'earthquake', id: 3 }
      ];
      const grouped = helpers.groupByKey(arr, 'type');
      expect(grouped.flood).toHaveLength(2);
      expect(grouped.earthquake).toHaveLength(1);
    });

    it('should find object in array by key-value', () => {
      const arr = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
        { id: 3, name: 'Bob' }
      ];
      const found = helpers.findByKey(arr, 'id', 2);
      expect(found.name).toBe('Jane');
    });

    it('should get unique values from array', () => {
      const arr = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
      expect(helpers.getUniqueValues(arr)).toEqual([1, 2, 3, 4]);
    });
  });

  describe('Object Utilities', () => {
    
    it('should check if object is empty', () => {
      expect(helpers.isEmpty({})).toBe(true);
      expect(helpers.isEmpty({ key: 'value' })).toBe(false);
    });

    it('should merge objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { c: 3, d: 4 };
      expect(helpers.mergeObjects(obj1, obj2)).toEqual({
        a: 1, b: 2, c: 3, d: 4
      });
    });

    it('should deep clone object', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = helpers.deepClone(original);
      cloned.b.c = 3;
      expect(original.b.c).toBe(2);
    });

    it('should pick properties from object', () => {
      const obj = { id: 1, name: 'John', age: 30, email: 'john@example.com' };
      const picked = helpers.pickProperties(obj, ['id', 'name']);
      expect(picked).toEqual({ id: 1, name: 'John' });
    });

    it('should omit properties from object', () => {
      const obj = { id: 1, name: 'John', password: 'secret' };
      const omitted = helpers.omitProperties(obj, ['password']);
      expect(omitted).toEqual({ id: 1, name: 'John' });
      expect(omitted.password).toBeUndefined();
    });

    it('should convert object to query string', () => {
      const obj = { type: 'flood', risk: 0.8, active: true };
      const queryString = helpers.objectToQueryString(obj);
      expect(queryString).toContain('type=flood');
      expect(queryString).toContain('risk=0.8');
    });

    it('should get nested value from object', () => {
      const obj = { user: { profile: { name: 'John' } } };
      expect(helpers.getNestedValue(obj, 'user.profile.name')).toBe('John');
      expect(helpers.getNestedValue(obj, 'user.missing.value')).toBeUndefined();
    });

    it('should set nested value in object', () => {
      const obj = { user: {} };
      helpers.setNestedValue(obj, 'user.profile.name', 'John');
      expect(obj.user.profile.name).toBe('John');
    });
  });

  describe('Validation Utilities', () => {
    
    it('should validate URL', () => {
      expect(helpers.isValidURL('https://example.com')).toBe(true);
      expect(helpers.isValidURL('not-a-url')).toBe(false);
    });

    it('should validate phone number', () => {
      expect(helpers.isValidPhone('9999999999')).toBe(true);
      expect(helpers.isValidPhone('123')).toBe(false);
    });

    it('should validate coordinates', () => {
      expect(helpers.isValidCoordinates(28.7041, 77.1025)).toBe(true);
      expect(helpers.isValidCoordinates(100, 200)).toBe(false);
    });

    it('should validate required fields', () => {
      const data = { name: 'John', email: '' };
      const required = ['name', 'email'];
      const result = helpers.validateRequired(data, required);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('email is required');
    });

    it('should validate email format', () => {
      expect(helpers.isValidEmail('valid@example.com')).toBe(true);
      expect(helpers.isValidEmail('invalid.email')).toBe(false);
    });
  });

  describe('Geospatial Utilities', () => {
    
    it('should calculate distance between coordinates', () => {
      // Delhi to Mumbai approximately 1400 km
      const distance = helpers.calculateDistance(
        28.7041, 77.1025,  // Delhi
        19.0760, 72.8777   // Mumbai
      );
      expect(distance).toBeGreaterThan(1300);
      expect(distance).toBeLessThan(1500);
    });

    it('should check if point is within radius', () => {
      const centerLat = 28.7041, centerLon = 77.1025;
      const pointLat = 28.7100, pointLon = 77.1100;
      const isWithin = helpers.isWithinRadius(
        centerLat, centerLon,
        pointLat, pointLon,
        10  // 10 km radius
      );
      expect(isWithin).toBe(true);
    });

    it('should convert coordinates format', () => {
      const decimalDegrees = { lat: 28.7041, lon: 77.1025 };
      const dms = helpers.convertToDMS(decimalDegrees);
      expect(dms).toContain('°');
      expect(dms).toContain("'");
    });

    it('should get bearing between points', () => {
      const bearing = helpers.getBearing(
        28.7041, 77.1025,  // Point A
        19.0760, 72.8777   // Point B
      );
      expect(bearing).toBeGreaterThan(0);
      expect(bearing).toBeLessThan(360);
    });
  });

  describe('Storage Utilities', () => {
    
    it('should set and get local storage', () => {
      helpers.setLocalStorage('key', 'value');
      expect(helpers.getLocalStorage('key')).toBe('value');
    });

    it('should set and get session storage', () => {
      helpers.setSessionStorage('key', 'value');
      expect(helpers.getSessionStorage('key')).toBe('value');
    });

    it('should remove from storage', () => {
      helpers.setLocalStorage('key', 'value');
      helpers.removeFromStorage('key');
      expect(helpers.getLocalStorage('key')).toBeNull();
    });

    it('should clear storage', () => {
      helpers.setLocalStorage('key1', 'value1');
      helpers.setLocalStorage('key2', 'value2');
      helpers.clearStorage();
      expect(helpers.getLocalStorage('key1')).toBeNull();
      expect(helpers.getLocalStorage('key2')).toBeNull();
    });
  });

  describe('Format Utilities', () => {
    
    it('should format risk level to color', () => {
      expect(helpers.getRiskColor(0.2)).toBe('green');
      expect(helpers.getRiskColor(0.5)).toBe('yellow');
      expect(helpers.getRiskColor(0.8)).toBe('red');
    });

    it('should format incident status to badge', () => {
      const badge = helpers.getStatusBadge('resolved');
      expect(badge).toContain('resolved');
    });

    it('should format file size', () => {
      expect(helpers.formatFileSize(1024)).toBe('1.00 KB');
      expect(helpers.formatFileSize(1048576)).toBe('1.00 MB');
    });
  });

  describe('Error Handling Utilities', () => {
    
    it('should extract error message', () => {
      const error = { response: { data: { message: 'Error occurred' } } };
      expect(helpers.getErrorMessage(error)).toBe('Error occurred');
    });

    it('should handle API error response', () => {
      const error = {
        response: { status: 500, statusText: 'Internal Server Error' }
      };
      const message = helpers.handleAPIError(error);
      expect(message).toContain('500');
    });

    it('should format error for user display', () => {
      const technicalError = 'TypeError: Cannot read properties';
      const userMessage = helpers.getUserFriendlyError(technicalError);
      expect(userMessage.toLowerCase()).toContain('error');
    });
  });
});