import React from 'react';

type ArrowIconProps = React.SVGProps<SVGSVGElement>;

const ArrowIcon: React.FC<ArrowIconProps> = (props) => (
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
        <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" strokeWidth="20" />
        <line x1="100" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="20" />
        <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="10" />
    </svg>
);

export default ArrowIcon;
