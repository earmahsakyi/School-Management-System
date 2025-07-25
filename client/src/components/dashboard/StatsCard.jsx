import { motion } from 'framer-motion';
import { Users, UserCheck, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStats } from '../../actions/studentAction';

export function StatsCards() {
  const dispatch = useDispatch();
  const { stats, statsLoading, error } = useSelector((state) => state.student);

  useEffect(() => {
    dispatch(getStats());
  }, [dispatch]);

  // Define stats configuration with dynamic values
  const statsConfig = [
    {
      title: 'Total Students',
      value: stats?.data?.studentsCount || 0,
      change: stats?.data?.studentsChange || 'N/A',
      changeType: stats?.data?.studentsChangeType || 'neutral',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Parents',
      value: stats?.data?.parentsCount || 0,
      change: stats?.data?.parentsChange || 'N/A',
      changeType: stats?.data?.parentsChangeType || 'neutral',
      icon: UserCheck,
      color: 'text-academic-success',
      bgColor: 'bg-academic-success/10',
    },
    {
      title: 'Total Staff',
      value: stats?.data?.staffCount || 0,
      change: stats?.data?.staffChange || 'N/A',
      changeType: stats?.data?.staffChangeType || 'neutral',
      icon: BookOpen,
      color: 'text-academic-warning',
      bgColor: 'bg-academic-warning/10',
    },
  ];

  // Format numbers with commas
  const formatNumber = (num) => {
    if (typeof num === 'number') {
      return num.toLocaleString();
    }
    return num;
  };

  // Loading state
  if (statsLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3].map((index) => (
          <Card key={index} className="relative overflow-hidden border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="bg-gray-200 p-3 rounded-2xl animate-pulse">
                  <div className="h-6 w-6"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardContent className="p-6 text-center">
            <p className="text-red-500">Error loading stats: {error}</p>
            <button 
              onClick={() => dispatch(getStats())}
              className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statsConfig.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={{ y: -2 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {formatNumber(stat.value)}
                  </p>
                  <div className="flex items-center text-sm">
                    <span
                      className={
                        stat.changeType === 'positive'
                          ? 'text-academic-success'
                          : stat.changeType === 'negative'
                          ? 'text-academic-danger'
                          : 'text-muted-foreground' // For 'neutral' or 'New'
                      }
                    >
                      {stat.change}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      from last month
                    </span>
                  </div>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-2xl`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
