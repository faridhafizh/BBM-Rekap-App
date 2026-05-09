/**
 * Validation utilities for BBM Rekap App
 * Provides input validation and sanitization functions
 */

class Validator {
    // Sanitize HTML to prevent XSS
    static sanitizeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Sanitize string for general use
    static sanitizeString(str) {
        if (!str) return '';
        return str
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript protocol
            .replace(/on\w+=/gi, ''); // Remove event handlers
    }

    // Validate ID format (alphanumeric with some special chars)
    static validateID(id) {
        if (!id) return { valid: false, message: 'ID wajib diisi' };
        
        const sanitized = this.sanitizeString(id);
        if (!sanitized) return { valid: false, message: 'ID tidak valid' };
        
        // Allow alphanumeric, dash, underscore, space
        const idPattern = /^[a-zA-Z0-9\-_\s]+$/;
        if (!idPattern.test(sanitized)) {
            return { 
                valid: false, 
                message: 'ID hanya boleh mengandung huruf, angka, dash, underscore, dan spasi' 
            };
        }
        
        if (sanitized.length > 50) {
            return { valid: false, message: 'ID maksimal 50 karakter' };
        }
        
        return { valid: true, sanitized: sanitized };
    }

    // Validate date format (flexible Indonesian date format)
    static validateDate(dateStr) {
        if (!dateStr) return { valid: true, sanitized: '' }; // Empty is valid for "Data OK"
        
        const sanitized = this.sanitizeString(dateStr);
        
        // Accept various Indonesian date formats
        const patterns = [
            /^\d{1,2}\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}$/,
            /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/i,
            /^\d{1,2}\/\d{1,2}\/\d{4}$/,
            /^\d{4}-\d{2}-\d{2}$/
        ];
        
        const isValid = patterns.some(pattern => pattern.test(sanitized));
        
        if (!isValid) {
            return { 
                valid: false, 
                message: 'Format tanggal tidak valid. Gunakan format: "17 April 2026" atau "17/04/2026"' 
            };
        }
        
        return { valid: true, sanitized: sanitized };
    }

    // Validate KM (kilometer)
    static validateKM(kmStr) {
        if (!kmStr) return { valid: true, sanitized: '' }; // Empty is valid for "Data OK"
        
        const sanitized = this.sanitizeString(kmStr);
        
        // Only allow numbers
        const kmPattern = /^\d+$/;
        if (!kmPattern.test(sanitized)) {
            return { valid: false, message: 'KM hanya boleh mengandung angka' };
        }
        
        const km = parseInt(sanitized);
        if (km < 0) {
            return { valid: false, message: 'KM tidak boleh negatif' };
        }
        
        if (km > 999999) {
            return { valid: false, message: 'KM maksimal 6 digit' };
        }
        
        return { valid: true, sanitized: sanitized };
    }

    // Validate price/harga
    static validateHarga(hargaStr) {
        if (!hargaStr) return { valid: true, sanitized: '' }; // Empty is valid for "Data OK"
        
        const sanitized = this.sanitizeString(hargaStr);
        
        // Allow numbers with commas for thousands
        const hargaPattern = /^\d{1,3}(,\d{3})*$/;
        if (!hargaPattern.test(sanitized.replace(/\s/g, ''))) {
            return { valid: false, message: 'Harga hanya boleh mengandung angka (boleh dengan koma untuk ribuan)' };
        }
        
        const harga = parseInt(sanitized.replace(/,/g, ''));
        if (harga < 0) {
            return { valid: false, message: 'Harga tidak boleh negatif' };
        }
        
        if (harga > 9999999) {
            return { valid: false, message: 'Harga maksimal 7 digit' };
        }
        
        return { valid: true, sanitized: sanitized };
    }

    // Validate keterangan (optional field)
    static validateKeterangan(keterangan) {
        if (!keterangan) return { valid: true, sanitized: '' };
        
        const sanitized = this.sanitizeString(keterangan);
        
        if (sanitized.length > 200) {
            return { valid: false, message: 'Keterangan maksimal 200 karakter' };
        }
        
        return { valid: true, sanitized: sanitized };
    }

    // Validate status for unconditional menu
    static validateStatus(status) {
        if (!status) return { valid: false, message: 'Status wajib dipilih' };
        
        const sanitized = this.sanitizeString(status);
        const validStatuses = [
            'Butuh approved 2',
            'Butuh approved 3', 
            'Butuh di input',
            'No Item',
            'unverified'
        ];
        
        if (!validStatuses.includes(sanitized)) {
            return { valid: false, message: 'Status tidak valid' };
        }
        
        return { valid: true, sanitized: sanitized };
    }

    // Validate sheet name
    static validateSheetName(sheetName) {
        if (!sheetName) return { valid: false, message: 'Sheet wajib dipilih' };
        
        const sanitized = this.sanitizeString(sheetName);
        
        if (sanitized.length > 100) {
            return { valid: false, message: 'Nama sheet terlalu panjang' };
        }
        
        return { valid: true, sanitized: sanitized };
    }

    // Validate complete form data
    static validateFormData(formData) {
        const errors = [];
        const sanitized = {};
        
        // Validate ID
        const idValidation = this.validateID(formData.id);
        if (!idValidation.valid) {
            errors.push({ field: 'id', message: idValidation.message });
        } else {
            sanitized.id = idValidation.sanitized;
        }
        
        // Validate sheet name
        const sheetValidation = this.validateSheetName(formData.sheetName);
        if (!sheetValidation.valid) {
            errors.push({ field: 'sheetName', message: sheetValidation.message });
        } else {
            sanitized.sheetName = sheetValidation.sanitized;
        }
        
        // Validate based on type
        if (formData.tipe === 'input') {
            const dateValidation = this.validateDate(formData.tanggal);
            if (!dateValidation.valid) {
                errors.push({ field: 'tanggal', message: dateValidation.message });
            } else {
                sanitized.tanggal = dateValidation.sanitized;
            }
            
            const kmValidation = this.validateKM(formData.km);
            if (!kmValidation.valid) {
                errors.push({ field: 'km', message: kmValidation.message });
            } else {
                sanitized.km = kmValidation.sanitized;
            }
            
            const hargaValidation = this.validateHarga(formData.harga);
            if (!hargaValidation.valid) {
                errors.push({ field: 'harga', message: hargaValidation.message });
            } else {
                sanitized.harga = hargaValidation.sanitized;
            }
            
            const ketValidation = this.validateKeterangan(formData.keterangan);
            if (!ketValidation.valid) {
                errors.push({ field: 'keterangan', message: ketValidation.message });
            } else {
                sanitized.keterangan = ketValidation.sanitized;
            }
            
            sanitized.status = ''; // Clear status for input type
            
        } else if (formData.tipe === 'unconditional') {
            const statusValidation = this.validateStatus(formData.status);
            if (!statusValidation.valid) {
                errors.push({ field: 'status', message: statusValidation.message });
            } else {
                sanitized.status = statusValidation.sanitized;
            }
            
            // Clear input fields for unconditional type
            sanitized.tanggal = '';
            sanitized.km = '';
            sanitized.harga = '';
            sanitized.keterangan = '';
        }
        
        sanitized.tipe = formData.tipe;
        
        return {
            valid: errors.length === 0,
            errors: errors,
            sanitized: sanitized
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validator;
}
