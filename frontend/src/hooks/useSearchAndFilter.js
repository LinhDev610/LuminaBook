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

            // Filter theo date (nếu có)
            let byDate = true;
            if (dateFilter) {
                // Có thể mở rộng logic filter date sau
                // Tạm thời return true
                byDate = true;
            }

            return byStatus && byKeyword && byDate;
        });
    }, [data, searchQuery, statusFilter, dateFilter, searchFields, statusField, statusMap]);

    return filtered;
}

export default useSearchAndFilter;

