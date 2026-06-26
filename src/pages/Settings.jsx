import React, { useState, useEffect } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const session = useSession();
  const supabase = useSupabaseClient();

  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    notification_email: '',
    timezone: 'UTC',
    theme: 'light'
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'EST', label: 'Eastern Standard Time (EST)' },
    { value: 'PST', label: 'Pacific Standard Time (PST)' },
    { value: 'CST', label: 'Central Standard Time (CST)' },
    { value: 'MST', label: 'Mountain Standard Time (MST)' }
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user?.id) {
        setIsFetching(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching settings:', error);
        }

        if (data) {
          setFormData({
            display_name: data.display_name || '',
            email: data.email || session.user.email || '',
            notification_email: data.notification_email || '',
            timezone: data.timezone || 'UTC',
            theme: data.theme || 'light'
          });
        } else {
          setFormData(prev => ({
            ...prev,
            email: session.user.email || ''
          }));
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchSettings();
  }, [session, supabase]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'display_name':
        if (!value || value.trim() === '') {
          return 'Display name is required';
        }
        if (value.trim().length < 2) {
          return 'Display name must be at least 2 characters';
        }
        return '';

      case 'email':
        if (!value || value.trim() === '') {
          return 'Email is required';
        }
        if (!validateEmail(value)) {
          return 'Please enter a valid email address';
        }
        return '';

      case 'notification_email':
        if (value && value.trim() !== '' && !validateEmail(value)) {
          return 'Please enter a valid email address for notifications';
        }
        return '';

      case 'timezone':
        if (!value) {
          return 'Please select a timezone';
        }
        return '';

      default:
        return '';
    }
  };

  const validateAllFields = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(formData).forEach((key) => {
      if (key !== 'theme') {
        const error = validateField(key, formData[key]);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? (checked ? 'dark' : 'light') : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      display_name: true,
      email: true,
      notification_email: true,
      timezone: true
    });

    if (!validateAllFields()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    if (!session?.user?.id) {
      toast.error('You must be logged in to save settings');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: session.user.id,
          display_name: formData.display_name.trim(),
          email: formData.email.trim(),
          notification_email: formData.notification_email?.trim() || null,
          timezone: formData.timezone,
          theme: formData.theme,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw error;
      }

      toast.success('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Please log in to access settings</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name */}
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.display_name && touched.display_name
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="Enter your display name"
              />
              {errors.display_name && touched.display_name && (
                <p className="mt-1 text-sm text-red-600">{errors.display_name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.email && touched.email
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
              />
              {errors.email && touched.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Notification Email */}
            <div>
              <label htmlFor="notification_email" className="block text-sm font-medium text-gray-700 mb-1">
                Notification Email <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="email"
                id="notification_email"
                name="notification_email"
                value={formData.notification_email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.notification_email && touched.notification_email
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="Enter notification email (optional)"
              />
              {errors.notification_email && touched.notification_email && (
                <p className="mt-1 text-sm text-red-600">{errors.notification_email}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Leave blank to use your primary email for notifications
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.timezone && touched.timezone
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              {errors.timezone && touched.timezone && (
                <p className="mt-1 text-sm text-red-600">{errors.timezone}</p>
              )}
            </div>

            {/* Theme Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Theme
              </label>
              <div className="flex items-center space-x-4">
                <span className={`text-sm ${formData.theme === 'light' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  Light
                </span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={formData.theme === 'dark'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-sm ${formData.theme === 'dark' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  Dark
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
                  isLoading
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;