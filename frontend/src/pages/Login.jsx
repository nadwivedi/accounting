import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    state: '',
    pincode: '',
    gstNumber: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    upiId: ''
  });

  const { login, employeeLogin, register, loading } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!emailOrPhone || !password) {
      setError('Please fill all fields');
      return;
    }

    let result;
    if (activeTab === 'staff') {
      result = await employeeLogin(emailOrPhone, password);
    } else {
      result = await login(emailOrPhone, password);
    }

    if (result.success) {
      navigate('/stock');
    } else {
      setError(result.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (
      !formData.companyName
      || !formData.email
      || !formData.phone
      || !formData.state
      || !formData.pincode
      || !formData.bankName
      || !formData.accountNumber
      || !formData.ifscCode
      || !formData.accountHolderName
      || !formData.upiId
      || !password
    ) {
      setError('Please fill all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(formData.pincode)) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }

    const result = await register({
      ...formData,
      password
    });

    if (result.success) {
      navigate('/stock');
    } else {
      setError(result.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const inputClasses = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-gray-800 text-sm";
  const labelClasses = "block text-xs font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mb-3 shadow-lg shadow-blue-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">BillHub</h1>
          <p className="text-slate-400 text-xs">Inventory & Billing Management</p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-900/50 p-6 border border-white/20">
          <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
            <button
              onClick={() => { setActiveTab('signin'); setError(''); }}
              className={`flex-1 py-2 px-3 rounded-md font-medium text-xs transition-all duration-300 ${
                activeTab === 'signin'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('staff'); setError(''); }}
              className={`flex-1 py-2 px-3 rounded-md font-medium text-xs transition-all duration-300 ${
                activeTab === 'staff'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Staff Login
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); setRegisterStep(1); }}
              className={`flex-1 py-2 px-3 rounded-md font-medium text-xs transition-all duration-300 ${
                activeTab === 'register'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-3 p-3 bg-red-50/80 border border-red-200/50 text-red-600 rounded-lg text-xs flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {activeTab === 'signin' || activeTab === 'staff' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className={labelClasses}>{activeTab === 'staff' ? 'Mobile Number' : 'Email / Mobile'}</label>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className={inputClasses}
                  placeholder={activeTab === 'staff' ? 'Enter registered mobile' : 'email or mobile'}
                  required
                />
              </div>

              <div>
                <label className={labelClasses}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClasses}
                    placeholder="password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <div>
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${registerStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    1
                  </div>
                  <div className={`w-8 h-0.5 transition-all duration-300 ${registerStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${registerStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    2
                  </div>
                </div>
              </div>

              {registerStep === 1 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClasses}>Company *</label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className={inputClasses}
                        placeholder="ABC Traders"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={inputClasses}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClasses}>Mobile *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={inputClasses}
                        placeholder="9876543210"
                        maxLength="10"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>State *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className={inputClasses}
                        placeholder="Maharashtra"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClasses}>Pincode *</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        className={inputClasses}
                        placeholder="400001"
                        maxLength="6"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>GST Number</label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleInputChange}
                        className={inputClasses}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.companyName || !formData.email || !formData.phone || !formData.state || !formData.pincode) {
                        setError('Please fill all required fields');
                        return;
                      }
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(formData.email)) {
                        setError('Please enter a valid email');
                        return;
                      }
                      const phoneRegex = /^\d{10}$/;
                      if (!phoneRegex.test(formData.phone)) {
                        setError('Please enter a valid 10-digit mobile');
                        return;
                      }
                      const pincodeRegex = /^\d{6}$/;
                      if (!pincodeRegex.test(formData.pincode)) {
                        setError('Please enter a valid 6-digit pincode');
                        return;
                      }
                      setError('');
                      setRegisterStep(2);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                  >
                    Continue
                  </button>
                </div>
              )}

              {registerStep === 2 && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setRegisterStep(1)}
                      className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <p className="text-xs font-medium text-gray-500 uppercase">Bank Details</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClasses}>Bank Name *</label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        className={inputClasses}
                        placeholder="SBI"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Account No. *</label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        className={inputClasses}
                        placeholder="1234567890"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClasses}>IFSC Code *</label>
                      <input
                        type="text"
                        name="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleInputChange}
                        className={inputClasses}
                        placeholder="SBIN0000001"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>A/C Holder *</label>
                      <input
                        type="text"
                        name="accountHolderName"
                        value={formData.accountHolderName}
                        onChange={handleInputChange}
                        className={inputClasses}
                        placeholder="Name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>UPI ID *</label>
                    <input
                      type="text"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleInputChange}
                      className={inputClasses}
                      placeholder="name@upi"
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClasses}>Password *</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClasses}
                      placeholder="Min 6 chars"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </form>
              )}
            </div>
          )}

          <p className="text-center text-gray-500 text-xs mt-4">
            {activeTab !== 'register' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => {
                setActiveTab(activeTab !== 'register' ? 'register' : 'signin');
                setError('');
                setEmailOrPhone('');
                setPassword('');
                setRegisterStep(1);
              }}
              className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              {activeTab !== 'register' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          &copy; 2026 BillHub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
