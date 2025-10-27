import React, { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ManageProductsPage.module.scss';
import SearchAndSort from '../../../components/Common/SearchAndSort';

const cx = classNames.bind(styles);

function ManageProductsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [allProducts] = useState([
        { 
            id: 'SP0001', 
            name: 'Chuyện Đời Xưa', 
            category: 'Sách văn học', 
            price: 115300, 
            status: 'pending', 
            createdDate: '10/08/2025' 
        },
        { 
            id: 'SP0002', 
            name: 'Chuyện Đời Xưa', 
            category: 'Sách văn học', 
            price: 115300, 
            status: 'approved', 
            createdDate: '10/08/2025' 
        },
        { 
            id: 'SP0003', 
            name: 'Chuyện Đời Xưa', 
            category: 'Sách văn học', 
            price: 115300, 
            status: 'pending', 
            createdDate: '10/08/2025' 
        },
        { 
            id: 'SP0004', 
            name: 'Sách Kinh Tế', 
            category: 'Sách kinh tế', 
            price: 200000, 
            status: 'approved', 
            createdDate: '09/08/2025' 
        },
        { 
            id: 'SP0005', 
            name: 'Sách Lịch Sử', 
            category: 'Sách lịch sử', 
            price: 150000, 
            status: 'rejected', 
            createdDate: '08/08/2025' 
        }
    ]);
    const [filteredProducts, setFilteredProducts] = useState(allProducts);

    // Search and sort options for products
    const productSearchPlaceholder = "Tìm kiếm theo mã đơn, tên sản phẩm,......";
    const categoryOptions = [
        { value: 'all', label: 'Tất cả danh mục' },
        { value: 'Sách văn học', label: 'Sách văn học' },
        { value: 'Sách kinh tế', label: 'Sách kinh tế' },
        { value: 'Sách lịch sử', label: 'Sách lịch sử' },
        { value: 'Sách khoa học', label: 'Sách khoa học' }
    ];
    const statusOptions = [
        { value: 'all', label: 'Tất cả trạng thái' },
        { value: 'pending', label: 'Chờ duyệt' },
        { value: 'approved', label: 'Đã duyệt' },
        { value: 'rejected', label: 'Đã từ chối' }
    ];

    const handleSearchChange = (e) => {
        const newSearchTerm = e.target.value;
        setSearchTerm(newSearchTerm);
        applyFilters(newSearchTerm, categoryFilter, statusFilter);
    };

    const handleCategoryChange = (e) => {
        const newCategory = e.target.value;
        setCategoryFilter(newCategory);
        applyFilters(searchTerm, newCategory, statusFilter);
    };

    const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        setStatusFilter(newStatus);
        applyFilters(searchTerm, categoryFilter, newStatus);
    };

    const handleSearchClick = () => {
        applyFilters(searchTerm, categoryFilter, statusFilter);
    };

    const applyFilters = (search, category, status) => {
        let filtered = allProducts;
        
        // Filter by search term (product ID, name)
        if (search && search.trim()) {
            const searchLower = search.toLowerCase().trim();
            filtered = filtered.filter(product => 
                product.id.toLowerCase().includes(searchLower) ||
                product.name.toLowerCase().includes(searchLower)
            );
        }
        
        // Filter by category
        if (category !== 'all') {
            filtered = filtered.filter(product => product.category === category);
        }
        
        // Filter by status
        if (status !== 'all') {
            filtered = filtered.filter(product => product.status === status);
        }
        
        setFilteredProducts(filtered);
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Chờ duyệt';
            case 'approved': return 'Đã duyệt';
            case 'rejected': return 'Đã từ chối';
            default: return status;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'pending': return 'pending';
            case 'approved': return 'approved';
            case 'rejected': return 'rejected';
            default: return '';
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedProducts(filteredProducts.map(product => product.id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (productId) => {
        setSelectedProducts(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            } else {
                return [...prev, productId];
            }
        });
    };

    const isAllSelected = filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length;
    const isIndeterminate = selectedProducts.length > 0 && selectedProducts.length < filteredProducts.length;

    return (
        <div className={cx('admin-page')}>
            <h1 className={cx('page-title')}>Quản lý sản phẩm</h1>
            
            <div className={cx('search-sort-container')}>
                <div className={cx('search-section')}>
                    <input
                        type="text"
                        placeholder={productSearchPlaceholder}
                        className={cx('search-input')}
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    <button className={cx('search-btn')} onClick={handleSearchClick}>
                        Tìm kiếm
                    </button>
                </div>

                <div className={cx('sort-section')}>
                    <span className={cx('sort-label')}>Sắp xếp:</span>
                    <select className={cx('sort-dropdown')} value={categoryFilter} onChange={handleCategoryChange}>
                        {categoryOptions.map((option, index) => (
                            <option key={index} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                <div className={cx('sort-section')}>
                    <select className={cx('sort-dropdown')} value={statusFilter} onChange={handleStatusChange}>
                        {statusOptions.map((option, index) => (
                            <option key={index} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className={cx('table-container')}>
                <table className={cx('data-table')}>
                    <thead>
                        <tr className={cx('table-header')}>
                            <th>
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    ref={input => {
                                        if (input) input.indeterminate = isIndeterminate;
                                    }}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th>Mã sản phẩm</th>
                            <th>Tên sản phẩm</th>
                            <th>Danh mục</th>
                            <th>Giá</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.id} className={cx('table-row')}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.includes(product.id)}
                                        onChange={() => handleSelectProduct(product.id)}
                                    />
                                </td>
                                <td>{product.id}</td>
                                <td>{product.name}</td>
                                <td>{product.category}</td>
                                <td>{formatPrice(product.price)}</td>
                                <td className={cx('status', getStatusClass(product.status))}>
                                    {getStatusText(product.status)}
                                </td>
                                <td>{product.createdDate}</td>
                                <td className={cx('actions')}>
                                    <button className={cx('btn', 'view-btn')}>Xem chi tiết</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ManageProductsPage;
