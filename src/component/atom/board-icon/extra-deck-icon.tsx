export const ExtraDeckIcon = (props: React.SVGProps<SVGSVGElement>) => {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 42 82"
        {...props}
    >
        <g fill="none" stroke="currentColor" strokeWidth={2} pointerEvents="all">
            <ellipse cx={21} cy={41} rx={20} ry={40} />
            <path strokeMiterlimit={10} d="M1 41h40M21 1v80" />
        </g>
    </svg>;
};