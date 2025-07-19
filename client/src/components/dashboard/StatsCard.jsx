import { motion } from 'framer-motion';
import { Users, UserCheck, BookOpen, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const stats = [
  {
    title: 'Total Students',
    value: '2,847',
    change: '+12%',
    changeType: 'positive' ,
    icon: Users,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: 'Total Staff',
    value: '164',
    change: '+3%',
    changeType: 'positive' ,
    icon: UserCheck,
    color: 'text-academic-success',
    bgColor: 'bg-academic-success/10',
  },
  {
    title: 'Total Classes',
    value: '38',
    change: '+2',
    changeType: 'positive' ,
    icon: BookOpen,
    color: 'text-academic-warning',
    bgColor: 'bg-academic-warning/10',
  },
  {
    title: 'Outstanding Fees',
    value: '$45,230',
    change: '-8%',
    changeType: 'negative',
    icon: DollarSign,
    color: 'text-academic-danger',
    bgColor: 'bg-academic-danger/10',
  },
];

export function StatsCards() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
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
                    {stat.value}
                  </p>
                  <div className="flex items-center text-sm">
                    <span
                      className={
                        stat.changeType === 'positive'
                          ? 'text-academic-success'
                          : 'text-academic-danger'
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