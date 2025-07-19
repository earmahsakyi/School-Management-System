import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const recentTransactions = [
  {
    id: 'TXN001',
    studentName: 'Alice Johnson',
    class: 'Grade 10A',
    amount: '$1,200',
    status: 'Paid',
    date: '2024-01-15',
  },
  {
    id: 'TXN002',
    studentName: 'Bob Smith',
    class: 'Grade 11B',
    amount: '$1,150',
    status: 'Pending',
    date: '2024-01-14',
  },
  {
    id: 'TXN003',
    studentName: 'Carol Williams',
    class: 'Grade 9C',
    amount: '$1,100',
    status: 'Paid',
    date: '2024-01-13',
  },
  {
    id: 'TXN004',
    studentName: 'David Brown',
    class: 'Grade 12A',
    amount: '$1,300',
    status: 'Overdue',
    date: '2024-01-10',
  },
  {
    id: 'TXN005',
    studentName: 'Eve Davis',
    class: 'Grade 8B',
    amount: '$1,050',
    status: 'Paid',
    date: '2024-01-12',
  },
];

export function FeesTable() {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-academic-success/10 text-academic-success border-academic-success/20';
      case 'Pending':
        return 'bg-academic-warning/10 text-academic-warning border-academic-warning/20';
      case 'Overdue':
        return 'bg-academic-danger/10 text-academic-danger border-academic-danger/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Fee Transactions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest fee payments and pending dues
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Student
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Class
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2">
                      <div className="font-medium text-sm">{transaction.studentName}</div>
                      <div className="text-xs text-muted-foreground">{transaction.id}</div>
                    </td>
                    <td className="py-3 px-2 text-sm text-foreground">
                      {transaction.class}
                    </td>
                    <td className="py-3 px-2 text-sm font-medium text-foreground">
                      {transaction.amount}
                    </td>
                    <td className="py-3 px-2">
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(transaction.status)}
                      >
                        {transaction.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}