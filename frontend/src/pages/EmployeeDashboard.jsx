import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const [groups, setGroups] = useState([]);
  const [unassignedEmployees, setUnassignedEmployees] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    if (userInfo.role === 'admin') {
      navigate('/admin-dashboard');
      return;
    }
    
    if (userInfo.role === 'division_head') {
      fetchDivisionData();
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const fetchDivisionData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${userInfo.token}` };
      
      const [groupsRes, unassignedRes] = await Promise.all([
        fetch('http://localhost:5000/api/division/groups', { headers }),
        fetch('http://localhost:5000/api/division/unassigned', { headers })
      ]);
      
      if (groupsRes.ok && unassignedRes.ok) {
        setGroups(await groupsRes.json());
        setUnassignedEmployees(await unassignedRes.json());
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName) return;
    try {
      const response = await fetch('http://localhost:5000/api/division/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ name: newGroupName })
      });
      if (response.ok) {
        setNewGroupName('');
        fetchDivisionData();
      }
    } catch (err) {
      alert('Error creating group');
    }
  };

  const handleAssignToGroup = async (userId, groupId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/division/assign-group/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ groupId })
      });
      if (response.ok) fetchDivisionData();
    } catch (err) {
      alert('Error assigning user');
    }
  };

  const handlePromoteGroupHead = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/division/promote-group-head/${userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (response.ok) fetchDivisionData();
    } catch (err) {
      alert('Error promoting user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Employee Dashboard <span style={{fontSize: '1rem', color: '#6b7280'}}>({userInfo.role.replace('_', ' ').toUpperCase()})</span></h1>
        <button onClick={handleLogout} className="btn" style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Logout</button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {/* Basic Info for everyone */}
      <div style={{ background: 'var(--card-bg, #fff)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <h2>Welcome, {userInfo.name}</h2>
        <p>Email: {userInfo.email}</p>
        <p>Role: {userInfo.role.replace('_', ' ')}</p>
      </div>

      {/* Division Head specific view */}
      {userInfo.role === 'division_head' && (
        <>
          <div style={{ background: 'var(--card-bg, #fff)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
            <h2>Create a Group</h2>
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <input 
                type="text" 
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group Name"
                style={{ padding: '0.5rem', flex: 1, border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <button type="submit" style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Create</button>
            </form>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* My Groups */}
            <div style={{ background: 'var(--card-bg, #fff)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h2>My Groups</h2>
              {groups.length === 0 && <p style={{marginTop: '1rem'}}>No groups created yet.</p>}
              {groups.map(group => (
                <div key={group.id} style={{ marginTop: '1.5rem', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '4px' }}>
                  <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>{group.name}</h3>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {group.members.length === 0 && <li style={{ color: '#6b7280' }}>No members yet</li>}
                    {group.members.map(member => (
                      <li key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span>{member.name} {member.role === 'group_head' && <span style={{color: '#d97706', fontSize: '0.8rem'}}>(Group Head)</span>}</span>
                        {member.role !== 'group_head' && (
                          <button 
                            onClick={() => handlePromoteGroupHead(member.id)}
                            style={{ padding: '0.25rem 0.5rem', background: '#f59e0b', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Make Group Head
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Unassigned Employees */}
            <div style={{ background: 'var(--card-bg, #fff)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h2>Unassigned Employees</h2>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                {unassignedEmployees.length === 0 && <p>All employees are assigned.</p>}
                {unassignedEmployees.map(emp => (
                  <li key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span>{emp.name}</span>
                    <select 
                      onChange={(e) => {
                        if(e.target.value) handleAssignToGroup(emp.id, e.target.value);
                      }}
                      style={{ padding: '0.25rem', borderRadius: '4px' }}
                      defaultValue=""
                    >
                      <option value="" disabled>Assign to group...</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Placeholder for Group Head view */}
      {userInfo.role === 'group_head' && (
        <div style={{ background: 'var(--card-bg, #fff)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2>Group Members</h2>
          <p>Group head dashboard coming soon...</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
