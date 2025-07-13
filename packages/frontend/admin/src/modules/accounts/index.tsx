import { useEffect, useMemo, useState } from 'react';

import { Header } from '../header';
import { useColumns } from './components/columns';
import { DataTable } from './components/data-table';
import type { UserType } from './schema';
import { useUserList } from './use-user-list';

export function AccountPage() {
  const { users, pagination, setPagination, usersCount } = useUserList();
  // Remember the user temporarily, because userList is paginated on the server side,can't get all users at once.
  const [memoUsers, setMemoUsers] = useState<UserType[]>([]);

  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set<string>()
  );
  const columns = useColumns({ setSelectedUserIds });

  useEffect(() => {
    setMemoUsers(prev => [...new Set([...prev, ...users])]);
  }, [users]);

  const selectedUsers = useMemo(() => {
    return memoUsers.filter(user => selectedUserIds.has(user.id));
  }, [selectedUserIds, memoUsers]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="relative z-0">
        <div className="absolute inset-x-0 -top-[10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-[20rem]" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5]/20 to-[#9089fc]/20 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>
      </div>
      
      <Header title="账户管理" />

      <div className="flex-1 overflow-hidden">
        <div className="h-full max-h-[calc(100vh-70px)]">
          <DataTable
            data={users}
            columns={columns}
            pagination={pagination}
            usersCount={usersCount}
            onPaginationChange={setPagination}
            selectedUsers={selectedUsers}
            setMemoUsers={setMemoUsers}
          />
        </div>
      </div>
    </div>
  );
}
export { AccountPage as Component };
