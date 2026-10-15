import { useEffect, useState } from 'react'
import { getMyAccount } from '../../api/accounts'
import { formatPeso } from '../../utils/formatPeso'

export default function CustomerDashboard() {
  const [account, setAccount] = useState(null)

  useEffect(() => {
    getMyAccount().then((res) => setAccount(res.data))
  }, [])

  return (
    <div>
      <h1>Customer Dashboard</h1>
      <p>Placeholder.</p>
      {account && (
        <p>
          Account {account.accountNumber}: {formatPeso(account.balance)}
        </p>
      )}
    </div>
  )
}
