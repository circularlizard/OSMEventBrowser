import { describe, it, expect } from 'vitest';
import { extractSections } from './data-helpers';

describe('data-helpers', () => {
    describe('extractSections', () => {
        it('should return empty array if startupData is null', () => {
            expect(extractSections(null)).toEqual([]);
        });

        it('should extract sections correctly from valid startupData', () => {
            const mockData = {
                globals: {
                    roles: [
                        {
                            sectionid: '123',
                            sectionname: 'Test Section',
                            groupname: 'Test Group',
                            section: 'scouts',
                            isDefault: '1',
                            permissions: { event: 10 }
                        }
                    ]
                }
            };

            const sections = extractSections(mockData);
            expect(sections).toHaveLength(1);
            expect(sections[0]).toEqual({
                sectionId: '123',
                sectionName: 'Test Section',
                groupName: 'Test Group',
                sectionType: 'scouts',
                isDefault: true,
                permissions: { event: 10 }
            });
        });
    });
});
