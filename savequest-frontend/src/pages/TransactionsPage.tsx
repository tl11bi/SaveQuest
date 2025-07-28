import * as React from 'react';
import styles from './DashboardStyles';
import { getUserTransactions } from '../api/axios';
import PlaidLinkModal from './PlaidLinkModal';

interface TransactionsPageProps {
  user: { name: string; photo: string };
}

interface Transaction {
  transaction_id: string;
  amount: number;
  date: string;
  authorized_date?: string;
  merchant_name?: string;
  personal_finance_category?: {
    primary?: string;
    detailed?: string;
  };
  account_id: string;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ user }) => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showPlaidModal, setShowPlaidModal] = React.useState(false);

  // Load transactions
  React.useEffect(() => {
    const loadTransactions = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setLoadingTransactions(false);
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const apiService = (await import('../api/axios')).default;
          apiService.setAuthToken(token);
        }
        const response = await getUserTransactions(userId);
        if (response.data.success) {
          setTransactions(response.data.transactions || []);
        } else {
          setError('Failed to load transactions.');
        }
      } catch (err) {
        console.error('Failed to load transactions:', err);
        setError('Failed to load transactions.');
      } finally {
        setLoadingTransactions(false);
      }
    };
    loadTransactions();
  }, []);

  const formatTransactionDate = (transaction: Transaction) => {
    const date = transaction.authorized_date || transaction.date;
    // Parse the date as local time to avoid timezone offset issues
    const dateStr = date.includes('T') ? date.split('T')[0] : date;
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day); // month is 0-indexed
    
    return localDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTransactionAmount = (amount: number) => {
    const isDebit = amount > 0;
    return {
      formatted: `${isDebit ? '-' : '+'}$${Math.abs(amount).toFixed(2)}`,
      color: isDebit ? '#f44336' : '#4caf50'
    };
  };

  const getCategoryIcon = (category?: string) => {
    const primary = category?.toLowerCase();
    switch (primary) {
      case 'food_and_drink': return '🍽️';
      case 'transportation': return '🚗';
      case 'general_merchandise': return '🛍️';
      case 'entertainment': return '🎬';
      case 'transfer': return '💸';
      case 'payment': return '💳';
      case 'deposit': return '💰';
      default: return '💳';
    }
  };

  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const groups: { [date: string]: { transactions: Transaction[], sortDate: string } } = {};
    
    transactions.forEach(transaction => {
      const date = transaction.authorized_date || transaction.date;
      // Parse the date as local time to avoid timezone offset issues
      const dateStr = date.includes('T') ? date.split('T')[0] : date;
      const [year, month, day] = dateStr.split('-').map(Number);
      const localDate = new Date(year, month - 1, day); // month is 0-indexed
      
      // Create a consistent date key for display
      const dateKey = localDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      
      // Keep the original date for sorting
      const sortDate = dateStr; // YYYY-MM-DD format
      
      if (!groups[dateKey]) {
        groups[dateKey] = { transactions: [], sortDate };
      }
      groups[dateKey].transactions.push(transaction);
    });
    
    return groups;
  };

  const groupedTransactions = groupTransactionsByDate(transactions);
  const sortedDateKeys = Object.keys(groupedTransactions).sort((a, b) => {
    const dateA = groupedTransactions[a].sortDate;
    const dateB = groupedTransactions[b].sortDate;
    return dateB.localeCompare(dateA); // Sort in descending order (newest first)
  });

  return (
    <div style={styles.pageContainer as React.CSSProperties}>
      <header style={styles.appBar as React.CSSProperties}>
        <span style={styles.logo as React.CSSProperties}>SaveQuest</span>
        <div style={styles.profileRow as React.CSSProperties}>
          <img 
            src={user.photo || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM0Mjg1RjQiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik04IDhDMTAuMjA5MSA4IDEyIDYuMjA5MTQgMTIgNEMxMiAxLjc5MDg2IDEwLjIwOTEgMCA4IDBDNS43OTA4NiAwIDQgMS43OTA4NiA0IDRDNCA2LjIwOTE0IDUuNzkwODYgOCA4IDhaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTYgMTZWMTRDMTYgMTEuNzkwOSAxNC4yMDkxIDEwIDEyIDEwSDRDMS43OTA4NiAxMCAwIDExLjc5MDkgMCAxNFYxNkgxNloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4='} 
            alt="Profile" 
            style={styles.profileIcon as React.CSSProperties}
          />
        </div>
      </header>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#333' }}>Transactions</h1>
        <p style={{ color: '#666', fontSize: 16, marginBottom: 20 }}>Review your recent financial activity</p>

        {error && (
          <div style={{ 
            color: '#f44336', 
            marginBottom: 16, 
            padding: '12px 16px', 
            backgroundColor: '#ffeaea', 
            borderRadius: 8, 
            border: '1px solid #f44336',
            fontSize: 14
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div style={{ marginBottom: 80 }}>
        {loadingTransactions ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>Loading transactions...</div>
            <div style={{ fontSize: 14, color: '#999' }}>Please wait while we fetch your data</div>
          </div>
        ) : transactions.length > 0 ? (
          <div>
            {sortedDateKeys.map(dateKey => (
              <div key={dateKey} style={{ marginBottom: 24 }}>
                <div style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  color: '#333', 
                  marginBottom: 12,
                  padding: '8px 0',
                  borderBottom: '2px solid #f0f0f0'
                }}>
                  {dateKey}
                </div>
                <div>
                  {groupedTransactions[dateKey].transactions.map((transaction) => {
                    const amountInfo = formatTransactionAmount(transaction.amount);
                    return (
                      <div 
                        key={transaction.transaction_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '16px',
                          marginBottom: '8px',
                          backgroundColor: '#fff',
                          borderRadius: 12,
                          border: '1px solid #e0e0e0',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <div style={{ 
                            fontSize: 24, 
                            marginRight: 12,
                            width: 40,
                            textAlign: 'center'
                          }}>
                            {getCategoryIcon(transaction.personal_finance_category?.primary)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: 600, 
                              fontSize: 16, 
                              color: '#333',
                              marginBottom: 2
                            }}>
                              {transaction.merchant_name || 'Unknown Merchant'}
                            </div>
                            <div style={{ 
                              fontSize: 13, 
                              color: '#666',
                              display: 'flex',
                              gap: 8
                            }}>
                              {transaction.personal_finance_category?.detailed && (
                                <span>{transaction.personal_finance_category.detailed.replace(/_/g, ' ')}</span>
                              )}
                              <span>•</span>
                              <span>{formatTransactionDate(transaction)}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ 
                          fontWeight: 700, 
                          fontSize: 16,
                          color: amountInfo.color,
                          textAlign: 'right',
                          minWidth: 80
                        }}>
                          {amountInfo.formatted}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: 12, 
            border: '2px dashed #dee2e6' 
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#333' }}>No transactions found</div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
              Connect your bank account to see your transaction history.
            </div>
            <button 
              style={{ 
                background: '#1976d2', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                padding: '12px 24px', 
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onClick={() => {
                setShowPlaidModal(true);
              }}
            >
              Link Bank Account
            </button>
          </div>
        )}
      </div>

      {/* Plaid Link Modal */}
      <PlaidLinkModal
        userId={localStorage.getItem('userId') || ''}
        open={showPlaidModal}
        onClose={() => setShowPlaidModal(false)}
        onSuccess={() => {
          setShowPlaidModal(false);
          // Refresh transactions after successful linking
          window.location.reload();
        }}
      />
    </div>
  );
};

export default TransactionsPage;
