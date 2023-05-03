export const FieldIcon = (props: React.SVGProps<SVGSVGElement>) => {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-0.5 -0.5 62 72"
        {...props}
    >
        <path
            fill="none"
            stroke="currentColor"
            strokeMiterlimit={10}
            strokeWidth={2}
            d="m1 36 24-7 6-28 6 28 24 7-24 7-6 28-6-28Z"
            pointerEvents="all"
        />
    </svg>;
};