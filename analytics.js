/**
 * Analytics functionality for BBM Rekap App
 * Provides data visualization and export features
 */

class Analytics {
  constructor() {
    this.currentData = [];
    this.chartInstance = null;
  }

  // Load analytics data
  async loadAnalytics(sheetName, apiUrl) {
    try {
      const response = await fetch(`${apiUrl}?action=getAll&sheetName=${encodeURIComponent(sheetName)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === "success") {
        this.currentData = result.data;
        return this.currentData;
      } else {
        throw new Error(result.message || "Gagal mengambil data analytics");
      }
    } catch (error) {
      console.error("Analytics load error:", error);
      throw error;
    }
  }

  // Calculate analytics statistics
  calculateStats(data) {
    const stats = {
      total: data.length,
      input: 0,
      unconditional: 0,
      noItem: 0,
      statusBreakdown: {}
    };

    data.forEach(record => {
      // Count by type
      if (record.tipe === 'input') {
        stats.input++;
      } else if (record.tipe === 'unconditional') {
        stats.unconditional++;
      }

      // Count No Item status
      if (record.status === 'No Item') {
        stats.noItem++;
      }

      // Status breakdown
      const status = record.status || 'No Status';
      stats.statusBreakdown[status] = (stats.statusBreakdown[status] || 0) + 1;
    });

    return stats;
  }

  // Update UI with statistics
  updateUI(stats) {
    document.getElementById('totalRecords').textContent = stats.total;
    document.getElementById('inputRecords').textContent = stats.input;
    document.getElementById('unconditionalRecords').textContent = stats.unconditional;
    document.getElementById('noItemRecords').textContent = stats.noItem;
  }

  // Draw status chart
  drawStatusChart(statusBreakdown) {
    const canvas = document.getElementById('statusCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const statuses = Object.keys(statusBreakdown);
    const values = Object.values(statusBreakdown);
    const total = values.reduce((sum, val) => sum + val, 0);

    if (total === 0) {
      // Draw empty state
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px Plus Jakarta Sans';
      ctx.textAlign = 'center';
      ctx.fillText('Tidak ada data untuk ditampilkan', width / 2, height / 2);
      return;
    }

    // Colors for different statuses
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ];

    // Draw pie chart
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    let currentAngle = -Math.PI / 2;

    statuses.forEach((status, index) => {
      const value = statusBreakdown[status];
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      
      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
      
      ctx.fillStyle = '#374151';
      ctx.font = '12px Plus Jakarta Sans';
      ctx.textAlign = labelX > centerX ? 'left' : 'right';
      ctx.fillText(`${status} (${value})`, labelX, labelY);
      
      currentAngle += sliceAngle;
    });

    // Draw legend
    let legendY = 20;
    statuses.forEach((status, index) => {
      const value = statusBreakdown[status];
      const percentage = ((value / total) * 100).toFixed(1);
      
      // Color box
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(10, legendY - 10, 12, 12);
      
      // Text
      ctx.fillStyle = '#374151';
      ctx.font = '11px Plus Jakarta Sans';
      ctx.textAlign = 'left';
      ctx.fillText(`${status}: ${value} (${percentage}%)`, 30, legendY);
      
      legendY += 18;
    });
  }

  // Export to CSV
  exportToCSV(data, sheetName) {
    if (!data || data.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    // Create CSV content
    const headers = ['ID', 'Tanggal', 'KM', 'Harga', 'Keterangan', 'Status', 'Tipe'];
    const csvContent = [
      headers.join(','),
      ...data.map(record => [
        `"${record.id || ''}"`,
        `"${record.tanggal || ''}"`,
        `"${record.km || ''}"`,
        `"${record.harga || ''}"`,
        `"${record.keterangan || ''}"`,
        `"${record.status || ''}"`,
        `"${record.tipe || ''}"`
      ].join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bbm_rekap_${sheetName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export to JSON
  exportToJSON(data, sheetName) {
    if (!data || data.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    // Create JSON content
    const exportData = {
      sheetName: sheetName,
      exportDate: new Date().toISOString(),
      totalRecords: data.length,
      records: data
    };

    const jsonContent = JSON.stringify(exportData, null, 2);

    // Create blob and download
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bbm_rekap_${sheetName}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Generate summary report
  generateSummaryReport(stats, sheetName) {
    const report = {
      sheetName: sheetName,
      generatedDate: new Date().toLocaleDateString('id-ID'),
      statistics: stats,
      insights: this.generateInsights(stats)
    };

    return report;
  }

  // Generate insights from statistics
  generateInsights(stats) {
    const insights = [];

    if (stats.total === 0) {
      insights.push("Tidak ada data dalam sheet ini.");
      return insights;
    }

    // Type distribution insights
    const inputPercentage = ((stats.input / stats.total) * 100).toFixed(1);
    const unconditionalPercentage = ((stats.unconditional / stats.total) * 100).toFixed(1);

    if (stats.input > stats.unconditional) {
      insights.push(`Sebagian besar data (${inputPercentage}%) adalah Menu Input, menunjukkan banyak data yang perlu dikoreksi.`);
    } else if (stats.unconditional > stats.input) {
      insights.push(`Sebagian besar data (${unconditionalPercentage}%) adalah Unconditional, menunjukkan banyak data yang masih menunggu approval.`);
    }

    // No Item insights
    if (stats.noItem > 0) {
      const noItemPercentage = ((stats.noItem / stats.total) * 100).toFixed(1);
      insights.push(`${stats.noItem} record (${noItemPercentage}%) memiliki status "No Item" yang perlu ditindaklanjuti.`);
    }

    // Status breakdown insights
    const statusEntries = Object.entries(stats.statusBreakdown);
    if (statusEntries.length > 1) {
      const mostCommonStatus = statusEntries.reduce((a, b) => a[1] > b[1] ? a : b);
      insights.push(`Status yang paling umum adalah "${mostCommonStatus[0]}" dengan ${mostCommonStatus[1]} record.`);
    }

    return insights;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Analytics;
}
