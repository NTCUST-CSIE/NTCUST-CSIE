import React, { useState, useEffect } from 'react';
import { CurrencyCircleDollar } from '@phosphor-icons/react';
import financeData from '../data/finance.json';

interface FinanceRecord {
  date: string;
  desc: string;
  income: number | null;
  expense: number | null;
  balance?: number;
}

interface MonthData {
  monthLabel: string;
  records: FinanceRecord[];
}

const formatCurrency = (num: number | null | undefined) => {
  if (num === null || num === undefined) return "-";
  return num.toLocaleString('en-US');
};

const Finance = () => {
  const [activeTab, setActiveTab] = useState<string>('116-1');
  const [tabTitle, setTabTitle] = useState<string>('116學年度上學期');

  useEffect(() => {
    // Reveal elements on scroll
    const revealElements = document.querySelectorAll('.finance-card, .section-title');
    revealElements.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    revealElements.forEach(el => observer.observe(el));
    return () => {
      revealElements.forEach(el => observer.unobserve(el));
    };
  }, [activeTab]); // Re-observe when tab changes if needed, but the card is always there

  const handleTabClick = (target: string, title: string) => {
    setActiveTab(target);
    setTabTitle(title);
  };

  const currentData = (financeData as globalThis.Record<string, MonthData[]>)[activeTab];

  let totalIncome = 0;
  let totalExpense = 0;
  let currentBalance = 0;
  let finalBalance = 0;

  if (currentData) {
    currentData.forEach(month => {
      month.records.forEach(record => {
        if (record.income) totalIncome += record.income;
        if (record.expense) totalExpense += record.expense;
        currentBalance += (record.income || 0) - (record.expense || 0);
        record.balance = currentBalance;
      });
    });
    finalBalance = totalIncome - totalExpense;
  }

  return (
    <>
      <div style={{ height: '100px' }}></div>
      <main>
        <section id="finance" className="finance-section">
          <div className="container">
            <h2 className="section-title">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <CurrencyCircleDollar className="title-icon" weight="fill" />
                財務報表
              </span>
              <span className="highlight">Finance</span>
            </h2>
            
            <div className="finance-tabs-wrapper">
              <div className="finance-tabs" id="finance-tabs">
                <button className={`finance-tab ${activeTab === '116-1' ? 'active' : ''}`} onClick={() => handleTabClick('116-1', '116學年度上學期')}>116學年度上學期</button>
                <button className={`finance-tab ${activeTab === '116-2' ? 'active' : ''}`} onClick={() => handleTabClick('116-2', '116學年度下學期')}>116學年度下學期</button>
                <a href="https://drive.google.com/drive/folders/1HmuAC7US5h5TlW69jyF5_AyKgMIkrXcK?usp=sharing" target="_blank" rel="noopener noreferrer" className="finance-tab">財務資料</a>
              </div>
            </div>

            <div className="glass-card finance-card">
              <div className="finance-header">
                <h3 className="finance-title">{tabTitle} 收支明細表</h3>
              </div>
              
              <div className="table-responsive">
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>摘要</th>
                      <th className="amount-col income">收入 (NT$)</th>
                      <th className="amount-col expense">支出 (NT$)</th>
                      <th className="amount-col balance">結餘 (NT$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData ? (
                      <>
                        {currentData.map((month, mIdx) => (
                          <React.Fragment key={mIdx}>
                            <tr className="month-divider">
                              <td colSpan={5}>{month.monthLabel}</td>
                            </tr>
                            {month.records.map((record, rIdx) => (
                              <tr key={`${mIdx}-${rIdx}`}>
                                <td>{record.date}</td>
                                <td>{record.desc}</td>
                                <td className="amount-col income">{formatCurrency(record.income)}</td>
                                <td className="amount-col expense">{formatCurrency(record.expense)}</td>
                                <td className="amount-col balance">{formatCurrency(record.balance)}</td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                        <tr className="total-row">
                          <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold' }}>本學期結餘總計</td>
                          <td className="amount-col income">{formatCurrency(totalIncome)}</td>
                          <td className="amount-col expense">{formatCurrency(totalExpense)}</td>
                          <td className="amount-col balance highlight-amount">{formatCurrency(finalBalance)}</td>
                        </tr>
                      </>
                    ) : (
                      <tr><td colSpan={5} style={{ textAlign: 'center' }}>無此學期的財務資料。</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="finance-footer">
                <p className="finance-note">※ 本報表經由系學會財務長編製，並由監查委員審核通過。所有開銷皆有發票收據留存備查。</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Finance;
