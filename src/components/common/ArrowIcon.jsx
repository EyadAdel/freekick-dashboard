import logo from '../../assets/logo.svg'; // Adjust path as needed

const ArrowIcon = ({
                       direction = 'left', // 'left', 'right', 'up', 'down'
                       size = 'md', // 'sm', 'md', 'lg', 'xl'
                       className = ''
                   }) => {
    // Size mappings
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-10 h-10'
    };

    // Rotation mappings (assuming logo points up by default)
    const rotationClasses = {
        up: 'rotate-0',
        right: 'rotate-90',
        down: 'rotate-180',
        left: '-rotate-90'
    };

    return (
        <img
            src={logo}
            alt="Arrow"
            className={`object-contain ${sizeClasses[size]} ${rotationClasses[direction]} ${className}`}
        />
    );
};

export default ArrowIcon;