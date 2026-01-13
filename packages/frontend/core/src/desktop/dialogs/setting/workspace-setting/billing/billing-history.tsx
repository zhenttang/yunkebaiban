import { Button, Loading } from '@yunke/component';
import { Pagination, SettingRow } from '@yunke/component/setting-components';
import { WorkspaceInvoicesService } from '@yunke/core/modules/cloud';
import { UrlService } from '@yunke/core/modules/url';
import { UserFriendlyError } from '@yunke/error';
// import { type InvoicesQuery, InvoiceStatus } from '@yunke/graphql';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import { useCallback, useEffect } from 'react';

import * as styles from './styles.css';

export const BillingHistory = () => {
  const t = useI18n();

  const invoicesService = useService(WorkspaceInvoicesService);
  const pageInvoices = useLiveData(invoicesService.invoices.pageInvoices$);
  const invoiceCount = useLiveData(invoicesService.invoices.invoiceCount$);
  const isLoading = useLiveData(invoicesService.invoices.isLoading$);
  const error = useLiveData(invoicesService.invoices.error$);
  const pageNum = useLiveData(invoicesService.invoices.pageNum$);

  useEffect(() => {
    invoicesService.invoices.revalidate();
  }, [invoicesService]);

  const handlePageChange = useCallback(
    (_: number, pageNum: number) => {
      invoicesService.invoices.setPageNum(pageNum);
      invoicesService.invoices.revalidate();
    },
    [invoicesService]
  );

  if (invoiceCount === undefined) {
    if (isLoading) {
      return <BillingHistorySkeleton />;
    } else {
      return (
        <span style={{ color: cssVar('errorColor') }}>
          {error
            ? UserFriendlyError.fromAny(error).message
            : '加载账单失败'}
        </span>
      );
    }
  }

  return (
    <div className={styles.history}>
      <div className={styles.historyContent}>
        {invoiceCount === 0 ? (
          <p className={styles.noInvoice}>
            {t['com.yunke.payment.billing-setting.no-invoice']()}
          </p>
        ) : (
          pageInvoices?.map(invoice => (
            <InvoiceLine key={invoice.id} invoice={invoice} />
          ))
        )}
      </div>

      {invoiceCount > invoicesService.invoices.PAGE_SIZE && (
        <Pagination
          totalCount={invoiceCount}
          countPerPage={invoicesService.invoices.PAGE_SIZE}
          pageNum={pageNum}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

const InvoiceLine = ({
  invoice,
}: {
  invoice: NonNullable<InvoicesQuery['currentUser']>['invoices'][0];
}) => {
  const t = useI18n();
  const urlService = useService(UrlService);

  const open = useCallback(() => {
    if (invoice.link) {
      urlService.openPopupWindow(invoice.link);
    }
  }, [invoice.link, urlService]);

  return (
    <SettingRow
      key={invoice.id}
      name={new Date(invoice.createdAt).toLocaleDateString()}
      desc={`${
        invoice.status === InvoiceStatus.Paid
          ? t['com.yunke.payment.billing-setting.paid']()
          : ''
      } $${invoice.amount / 100}`}
    >
      <Button onClick={open}>
        {t['com.yunke.payment.billing-setting.view-invoice']()}
      </Button>
    </SettingRow>
  );
};

const BillingHistorySkeleton = () => {
  return (
    <div className={styles.billingHistorySkeleton}>
      <Loading />
    </div>
  );
};
