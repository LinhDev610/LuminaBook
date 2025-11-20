import { useCallback, useState } from 'react';
import { getGhnDistricts, getGhnProvinces, getGhnWards } from '../../../services';

const normalizeProvince = (item = {}) => ({
    id: String(item?.ProvinceID ?? ''),
    name: item?.ProvinceName ?? '',
});

const normalizeDistrict = (item = {}) => ({
    id: String(item?.DistrictID ?? ''),
    name: item?.DistrictName ?? '',
    provinceId: String(item?.ProvinceID ?? ''),
});

const normalizeWard = (item = {}) => ({
    code: String(item?.WardCode ?? ''),
    name: item?.WardName ?? '',
    districtId: String(item?.DistrictID ?? ''),
});

export const useGhnLocations = () => {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [loading, setLoading] = useState({
        provinces: false,
        districts: false,
        wards: false,
    });
    const [error, setError] = useState(null);

    const wrapAsync = useCallback(async (fn, key) => {
        setLoading((prev) => ({ ...prev, [key]: true }));
        setError(null);
        try {
            return await fn();
        } catch (e) {
            console.error(`GHN ${key} fetch error`, e);
            setError('Không thể tải dữ liệu địa chỉ từ GHN. Vui lòng thử lại.');
            return [];
        } finally {
            setLoading((prev) => ({ ...prev, [key]: false }));
        }
    }, []);

    const loadProvinces = useCallback(async () => {
        const data = await wrapAsync(async () => {
            const resp = await getGhnProvinces();
            return Array.isArray(resp) ? resp : [];
        }, 'provinces');
        const normalized = data.map(normalizeProvince).filter((item) => item.id && item.name);
        setProvinces(normalized);
        return normalized;
    }, [wrapAsync]);

    const loadDistricts = useCallback(
        async (provinceId) => {
            if (!provinceId) {
                setDistricts([]);
                setWards([]);
                return [];
            }
            const data = await wrapAsync(async () => {
                const resp = await getGhnDistricts(provinceId);
                return Array.isArray(resp) ? resp : [];
            }, 'districts');
            const normalized = data.map(normalizeDistrict).filter((item) => item.id && item.name);
            setDistricts(normalized);
            return normalized;
        },
        [wrapAsync],
    );

    const loadWards = useCallback(
        async (districtId) => {
            if (!districtId) {
                setWards([]);
                return [];
            }
            const data = await wrapAsync(async () => {
                const resp = await getGhnWards(districtId);
                return Array.isArray(resp) ? resp : [];
            }, 'wards');
            const normalized = data.map(normalizeWard).filter((item) => item.code && item.name);
            setWards(normalized);
            return normalized;
        },
        [wrapAsync],
    );

    return {
        provinces,
        districts,
        wards,
        loading,
        error,
        setDistricts,
        setWards,
        loadProvinces,
        loadDistricts,
        loadWards,
    };
};

export const formatFullAddress = (address) => {
    if (!address) return '';
    const segments = [
        address.address,
        address.wardName,
        address.districtName,
        address.provinceName,
    ]
        .map((part) => (part || '').trim())
        .filter(Boolean);
    return segments.join(', ');
};

export const normalizeAddressPayload = (form) => ({
    recipientName: form.recipientName?.trim() ?? '',
    recipientPhoneNumber: form.recipientPhoneNumber?.trim() ?? '',
    provinceName: form.provinceName ?? '',
    provinceID: form.provinceID ?? '',
    districtName: form.districtName ?? '',
    districtID: form.districtID ?? '',
    wardName: form.wardName ?? '',
    wardCode: form.wardCode ?? '',
    address: form.address?.trim() ?? '',
    postalCode: form.postalCode?.trim() ?? '',
    defaultAddress: !!form.defaultAddress,
});
