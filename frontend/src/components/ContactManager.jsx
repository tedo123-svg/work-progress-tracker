import React, { useState } from 'react';
import { adminAPI } from '../services/api';
import { Mail, Phone, Edit, Check, X, User, Shield, Building } from 'lucide-react';

const ContactManager = ({ users, onUserUpdate }) => {
  const [editingContact, setEditingContact] = useState(null);
  const [contactData, setContactData] = useState({ email: '', phoneNumber: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEditContact = (user) => {
    setEditingContact(user.id);
    setContactData({
      email: user.email || '',
      phoneNumber: user.phone_number || ''
    });
    setError('');
  };

  const handleSaveContact = async (userId) => {
    const { email, phoneNumber } = contactData;
    
    // Validate inputs
    if (email && !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (phoneNumber && !/^[\+]?[1-9][\d\s\-\(\)]{7,20}$/.test(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }
    
    if (!email && !phoneNumber) {
      setError('Please provide at least email or phone number');
      return;
    }

    setLoading(true);
    try {
      await adminAPI.updateUserContact(userId, { email, phoneNumber });
      setEditingContact(null);
      setContactData({ email: '', phoneNumber: '' });
      setError('');
      onUserUpdate(); // Refresh the user list
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update contact information');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingContact(null);
    setContactData({ email: '', phoneNumber: '' });
    setError('');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="text-red-500" size={16} />;
      case 'main_branch':
        return <Building className="text-blue-500" size={16} />;
      default:
        return <User className="text-green-500" size={16} />;
    }
  };

  const getRoleLabel = (user) => {
    switch (user.role) {
      case 'admin':
        return 'Administrator';
      case 'main_branch':
        return 'Main Branch';
      default:
        return user.branch_name || 'Branch User';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-1">
          <Mail className="text-blue-500" size={20} />
          <Phone className="text-green-500" size={20} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Contact Management</h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {getRoleIcon(user.role)}
                  <div>
                    <div className="font-medium text-gray-900">{user.username}</div>
                    <div className="text-sm text-gray-500">{getRoleLabel(user)}</div>
                  </div>
                </div>

                {editingContact === user.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={contactData.email}
                        onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="user@example.com"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={contactData.phoneNumber}
                        onChange={(e) => setContactData({ ...contactData, phoneNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+251911000000"
                        disabled={loading}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleSaveContact(user.id)}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check size={14} />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {user.email || 'No email set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {user.phone_number || 'No phone number set'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {editingContact !== user.id && (
                <button
                  onClick={() => handleEditContact(user)}
                  className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  title="Edit contact information"
                >
                  <Edit size={14} />
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="text-sm text-blue-800">
          <strong>💡 Contact Information Tips:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Email addresses are required for 2FA verification codes</li>
            <li>Phone numbers can be used for SMS notifications (future feature)</li>
            <li>Use international format for phone numbers (+251...)</li>
            <li>Both email and phone must be unique across all users</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ContactManager;