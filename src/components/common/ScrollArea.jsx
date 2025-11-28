// src/components/common/ScrollArea.jsx
import React from 'react';
import {useSelector} from "react-redux";

const ScrollArea = ({ children, className = '' }) => {
    const { direction } = useSelector((state) => state.language);

    return (
        <div  className={`overflow-hidden ${className}`}>
            <div dir={direction==="rtl"?"ltr":"rtl"} className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
                {children}
            </div>
        </div>
    );
};

export default ScrollArea;