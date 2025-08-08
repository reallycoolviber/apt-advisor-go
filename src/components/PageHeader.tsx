import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface PageHeaderProps {
  defaultTitle?: string;
  icon?: React.ComponentType<any>;
}

export const PageHeader = ({ defaultTitle, icon: Icon }: PageHeaderProps) => {
  const navigate = useNavigate();
  const { title } = useParams();
  
  // Use the title from URL params, or fall back to default title
  const displayTitle = title ? decodeURIComponent(title) : defaultTitle;

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