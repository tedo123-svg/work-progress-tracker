import React, { useState } from 'react';
import { adminAPI } from '../services/api';
import { Mail, Edit, Check, X } from 'lucide-react';

const EmailManager = ({ users, onUserUpdate }) => {
  const [editingEmail, setEditingEmail] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEditEmail = (user) => {
    setEditingEmail(user.id);
    setNewEmail(user.email);
    setError('');
  };

  const handleSaveEmail = async (userId) => {
    if (!newEmail || !newEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await adminAPI.updateUserEmail(userId, newEmail);
      setEditingEmail(null);
      setNewEmail('');
      setError('');
      onUserUpdate(); // Refresh the user list
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingEmail(null);
    setNewEmail('');
    setError('');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="text-blue-500" size={20} />
        <h3 className="text-lg font-semibold text-gray-900">Email Management</h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium text-gray-900">{user.username}</div>
                  <div className="text-sm text-gray-500">
                    {user.role === 'admin' ? 'Administrator' : 
                     user.role === 'main_branch' ? 'Main Branch' : 
                     user.branch_name || 'Branch User'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editingEmail === user.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                    disabled={loading}
                  />
                  <button
                    onClick={() => handleSaveEmail(user.id)}
                    disabled={loading}
                    className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 min-w-0 flex-1">
                    {user.email || 'No email set'}
                  </span>
                  <button
                    onClick={() => handleEditEmail(user)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Edit email"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Users need valid email addresses to receive 2FA verification codes and password reset notifications.
        </div>
      </div>
    </div>
  );
};

export default EmailManager;