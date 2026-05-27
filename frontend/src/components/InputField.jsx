import { FaEye, FaEyeSlash } from 'react-icons/fa';

function InputField({ type, placeholder, label, value, onChange, togglePassword, showPassword }) {
  return (
    <div className="input-field">
      <label className='font-bold'>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{ width: '100%', paddingRight: togglePassword ? '40px' : '10px' }}
        />
        {togglePassword && (
          <span
            onClick={togglePassword}
            style={{
              position: 'absolute',
              right: '10px',
              top: '55%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              color: '#00235c',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#00235c')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#00235c')}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        )}
      </div>
    </div>
  );
}

export default InputField;