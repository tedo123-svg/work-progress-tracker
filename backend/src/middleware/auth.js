import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Alternative name for consistency
export const authenticateToken = authenticate;

export const authorizeMainBranch = (req, res, next) => {
  if (req.user.role !== 'main_branch') {
    return res.status(403).json({ error: 'Access denied. Main branch only.' });
  }
  next();
};

// Removed - replaced with updated version below

export const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Generic role authorization
export const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Access denied. ${role} role required.` });
    }
    next();
  };
};

// Allow multiple roles
export const requireAnyRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. One of these roles required: ${roles.join(', ')}` });
    }
    next();
  };
};

// Sector-specific authorization
export const authorizeSectorAdmin = (req, res, next) => {
  const sectorRoles = ['organization_sector', 'information_sector', 'operation_sector', 'peace_value_sector'];
  if (!sectorRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Sector admin role required.' });
  }
  next();
};

// Allow main branch, sector admins, and woreda sector users
export const authorizeMainBranchOrSector = (req, res, next) => {
  const allowedRoles = [
    'main_branch', 
    'organization_sector', 'information_sector', 'operation_sector', 'peace_value_sector',
    'woreda_organization', 'woreda_information', 'woreda_operation', 'woreda_peace_value'
  ];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Main branch, sector admin, or woreda sector user role required.' });
  }
  next();
};

// Woreda sector user authorization
export const authorizeWoredaSectorUser = (req, res, next) => {
  const woredaSectorRoles = ['woreda_organization', 'woreda_information', 'woreda_operation', 'woreda_peace_value'];
  if (!woredaSectorRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Woreda sector user role required.' });
  }
  next();
};

// Allow branch users (general or sector-specific)
export const authorizeBranchUser = (req, res, next) => {
  const branchRoles = ['branch_user', 'woreda_organization', 'woreda_information', 'woreda_operation', 'woreda_peace_value'];
  if (!branchRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Branch user role required.' });
  }
  next();
};

// Check if user can access specific sector data
export const authorizeSectorAccess = (sector) => {
  return (req, res, next) => {
    // Main branch can access all sectors
    if (req.user.role === 'main_branch') {
      return next();
    }
    
    // Sector admins can only access their own sector
    const sectorRoleMap = {
      'organization': 'organization_sector',
      'information': 'information_sector', 
      'operation': 'operation_sector',
      'peace_value': 'peace_value_sector'
    };
    
    if (req.user.role === sectorRoleMap[sector]) {
      return next();
    }
    
    return res.status(403).json({ error: 'Access denied. You can only access your own sector data.' });
  };
};