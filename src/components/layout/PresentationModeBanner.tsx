import React from 'react';

interface PresentationModeBannerProps {
    isVisible: boolean;
}

const PresentationModeBanner: React.FC<PresentationModeBannerProps> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="bg-orange-600 text-white px-4 py-2 text-center font-bold shadow-md z-50 fixed bottom-0 w-full left-0 right-0 flex items-center justify-center gap-2">
            <span className="text-xl">🔒</span>
            <span>وضع العرض - القراءة فقط (التعديلات غير مسموحة)</span>
        </div>
    );
};

export default PresentationModeBanner;
