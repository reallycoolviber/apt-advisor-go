import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface PageHeaderProps {
  defaultTitle?: string;
  icon?: React.ComponentType<any>;
}

export const PageHeader = ({ defaultTitle, icon: Icon }: PageHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract title from pathname more robustly
  const extractTitleFromPath = () => {
    try {
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1];
      
      if (lastSegment && lastSegment !== 'checklist' && lastSegment !== 'general' && lastSegment !== 'financial' && lastSegment !== 'physical') {
        return decodeURIComponent(lastSegment);
      }
      return null;
    } catch (error) {
      console.error('Error extracting title from path:', error);
      return null;
    }
  };
  
  // Use the title from URL path, or fall back to default title
  const displayTitle = extractTitleFromPath() || defaultTitle || 'Utvärdering';

  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-hover"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="p-2 hover:bg-hover"
        >
          <Home className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-6 w-6 text-primary" />}
        <h1 className="text-xl font-bold text-foreground">
          {displayTitle}
        </h1>
      </div>
      
      <div className="w-20"></div> {/* Spacer for balance */}
    </div>
  );
};