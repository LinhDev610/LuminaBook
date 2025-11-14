import { useMemo } from 'react';

/**
 * Custom hook để tìm kiếm và filter dữ liệu
 * @param {Array} data - Dữ liệu cần filter
 * @param {Object} options - Các tùy chọn filter
 * @param {string} options.searchQuery - Từ khóa tìm kiếm
 * @param {string} options.statusFilter - Filter theo trạng thái ('all', 'pending', 'approved', 'rejected')
 * @param {string} options.dateFilter - Filter theo ngày (tùy chọn)
 * @param {Object} options.searchFields - Các field để tìm kiếm (mặc định: ['name', 'title'])
 * @param {Object} options.statusField - Field chứa status (mặc định: 'status')
 * @param {Object} options.statusMap - Map status value với filter value (mặc định: standard)
 * @returns {Array} - Dữ liệu đã được filter
 */
export function useSearchAndFilter(data = [], options = {}) {
    const {
        searchQuery = '',
        statusFilter = 'all',
        dateFilter = '',
        searchFields = ['name', 'title'], // Hỗ trợ cả 'name' và 'title'
        statusField = 'status',
        statusMap = {
            pending: 'Chờ duyệt',
            approved: 'Đã duyệt',
            rejected: 'Từ chối',
        },
    } = options;

    const filtered = useMemo(() => {
        if (!data || !Array.isArray(data)) {
            return [];
        }

        return data.filter((item) => {
            // Filter theo status
            const byStatus =
                statusFilter === 'all' ||
                (statusFilter && item[statusField] === statusMap[statusFilter]);

            // Filter theo keyword (tìm kiếm)
            const byKeyword = !searchQuery
                ? true
                : searchFields.some((field) => {
                      const fieldValue = item[field];
                      if (!fieldValue) return false;
                      return fieldValue
                          .toString()
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase());
                  });

            // Filter theo date (nếu có) - hỗ trợ input mm/dd/yyyy
            let byDate = true;
            if (dateFilter) {
                const parseMmDdYyyy = (str) => {
                    if (!str || typeof str !== 'string') return null;
                    const parts = str.split('/');
                    if (parts.length !== 3) return null;
                    const [mm, dd, yyyy] = parts;
                    const m = parseInt(mm, 10);
                    const d = parseInt(dd, 10);
                    const y = parseInt(yyyy, 10);
                    if (!m || !d || !y) return null;
                    const dt = new Date(y, m - 1, d);
                    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
                    return dt;
                };

                const filterDate = parseMmDdYyyy(dateFilter);
                if (filterDate) {
                    const getItemDate = () => {
                        if (item.createdAt) {
                            return new Date(item.createdAt);
                        }
                        if (item.date) {
                            // try to parse mm/dd/yyyy or dd/mm/yyyy
                            const segs = String(item.date).split('/');
                            if (segs.length === 3) {
                                const [a, b, c] = segs;
                                // decide by >12 to detect dd/mm vs mm/dd
                                const first = parseInt(a, 10);
                                const second = parseInt(b, 10);
                                if (first > 12) {
                                    return new Date(parseInt(c, 10), second - 1, first);
                                }
                                return new Date(parseInt(c, 10), first - 1, second);
                            }
                        }
                        if (item.createDate) {
                            const segs = String(item.createDate).split('/');
                            if (segs.length === 3) {
                                const [dd, mm, yyyy] = segs;
                                return new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
                            }
                        }
                        return null;
                    };

                    const itemDate = getItemDate();
                    if (itemDate) {
                        byDate =
                            itemDate.getFullYear() === filterDate.getFullYear() &&
                            itemDate.getMonth() === filterDate.getMonth() &&
                            itemDate.getDate() === filterDate.getDate();
                    } else {
                        byDate = true;
                    }
                }
            }

            return byStatus && byKeyword && byDate;
        });
    }, [data, searchQuery, statusFilter, dateFilter, searchFields, statusField, statusMap]);

    return filtered;
}

export default useSearchAndFilter;

