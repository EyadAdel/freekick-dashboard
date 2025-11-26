const Card = ({
                  children,
                  className = '',
                  title,
                  icon,
                  actions
              }) => {
    return (
        <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
            {(title || actions) && (
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {icon && <span className="text-primary-500">{icon}</span>}
                        {title && <h3 className="text-lg font-semibold">{title}</h3>}
                    </div>
                    {actions && <div className="flex gap-2">{actions}</div>}
                </div>
            )}
            {children}
        </div>
    );
};

export default Card;