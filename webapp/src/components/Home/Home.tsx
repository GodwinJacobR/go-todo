// components/Home.tsx
import React, { useState, useEffect } from 'react';
import { TaskList } from '../../components/tasks';
import { Task as TaskType } from '../../types';
import { getMouseTrackingService, UserPosition, ConnectionStatus } from '../../services/websocket';
import './Home.css';

interface HomeProps {
  tasks: TaskType[];
}

interface MousePosition {
  x: number;
  y: number;
}

const Home: React.FC<HomeProps> = ({ tasks }) => {
  // Get a fresh instance of the mouse tracking service for this component
  const mouseTrackingService = React.useMemo(() => getMouseTrackingService(), []);
  
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [otherUsers, setOtherUsers] = useState<UserPosition[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const currentUserId = mouseTrackingService.getUserId();

  // Initialize WebSocket connection
  useEffect(() => {
    // Connect to WebSocket server
    mouseTrackingService.connect();

    // Add position listener
    const handlePositionsUpdate = (positions: UserPosition[]) => {
      // Filter out current user's position
      const others = positions.filter(pos => pos.userId !== currentUserId);
      console.log('Other users:', others.length, others);
      setOtherUsers(others);
    };

    // Add connection status listener
    const handleStatusUpdate = (status: ConnectionStatus) => {
      setConnectionStatus(status);
    };

    // Register listeners
    mouseTrackingService.addPositionListener(handlePositionsUpdate);
    mouseTrackingService.addStatusListener(handleStatusUpdate);

    // Cleanup on unmount
    return () => {
      mouseTrackingService.removePositionListener(handlePositionsUpdate);
      mouseTrackingService.removeStatusListener(handleStatusUpdate);
      mouseTrackingService.disconnect();
    };
  }, [mouseTrackingService, currentUserId]);

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const newPosition = {
        x: event.clientX,
        y: event.clientY
      };
      
      setMousePosition(newPosition);
      
      // Send position to WebSocket server
      mouseTrackingService.sendMousePosition(newPosition.x, newPosition.y);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseTrackingService]);

  // Format user ID for display
  const formatUserId = (userId: string) => {
    return userId.substring(0, 8);
  };

  // Get connection status display text
  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTING:
        return 'Connecting...';
      case ConnectionStatus.CONNECTED:
        return 'Connected';
      case ConnectionStatus.DISCONNECTED:
        return 'Disconnected';
      case ConnectionStatus.ERROR:
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="home-container">
      <header className="app-header">
        <h1>My Task List</h1>
        <div className="mouse-tracker-controls">
          <div className={`connection-status status-${connectionStatus}`}>
            Status: {getConnectionStatusText()}
          </div>
          <div className="users-count">
            Other Users: {otherUsers.length}
          </div>
          <div className="current-user-id">
            Your ID: {formatUserId(currentUserId)}
          </div>
        </div>
      </header>

      <TaskList tasks={tasks} />

      {/* Current user's mouse indicator */}
      <div 
        className="mouse-indicator current-user"
        style={{
          position: 'fixed',
          left: mousePosition.x,
          top: mousePosition.y,
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 0, 0, 0.7)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 9998
        }}
      >
        <div className="user-tooltip always-visible">
          You
        </div>
      </div>

      {/* Other users' mouse indicators - display as text instead of dots */}
      {otherUsers.map((user) => (
        <div 
          key={user.userId}
          className="mouse-indicator other-user user-id-display"
          style={{
            position: 'fixed',
            left: user.longitude, // Use longitude as x coordinate
            top: user.latitude,   // Use latitude as y coordinate
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9997
          }}
        >
          {formatUserId(user.userId)}
        </div>
      ))}
    </div>
  );
};

export default Home;