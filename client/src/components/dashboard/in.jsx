import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">School Document Designer</h1>
        <p className="text-xl text-muted-foreground mb-8">Professional school documents made easy</p>
        <Button 
          onClick={() => navigate('/report-card')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
        >
          Create Junior High Report Card
        </Button>
      </div>
    </div>
  );
};

export default Index;