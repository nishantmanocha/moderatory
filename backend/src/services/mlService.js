const { spawn } = require('child_process');
const path = require('path');

class MLService {
  static async runPythonScript(scriptName, ...args) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, '../../ml', scriptName);
      const pythonProcess = spawn('python3', [scriptPath, ...args]);
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        } else {
          try {
            const result = JSON.parse(stdout.trim());
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse Python script output: ${stdout}`));
          }
        }
      });
      
      // Set timeout for long-running scripts
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Python script timeout'));
      }, 30000); // 30 second timeout
    });
  }

  static async getSafeSaveRecommendation(userData, recentTransactions) {
    try {
      const userDataJson = JSON.stringify(userData);
      const transactionsJson = JSON.stringify(recentTransactions);
      
      return await this.runPythonScript('safeSaveModel.py', userDataJson, transactionsJson);
    } catch (error) {
      console.error('Safe save model error:', error);
      return {
        amount: 15.0,
        confidence: "Low",
        reasoning: "Default recommendation due to service error",
        alternatives: {
          conservative: 10.0,
          moderate: 15.0,
          aggressive: 25.0
        }
      };
    }
  }

  static async getGoalProjection(userData, transactionHistory) {
    try {
      const userDataJson = JSON.stringify(userData);
      const historyJson = JSON.stringify(transactionHistory);
      
      return await this.runPythonScript('goalForecast.py', userDataJson, historyJson);
    } catch (error) {
      console.error('Goal forecast error:', error);
      return {
        goal_date: null,
        months_to_goal: null,
        projected_amount: 0,
        weekly_trend: 0,
        message: "Unable to calculate projection at this time"
      };
    }
  }

  static async categorizeMerchant(merchantData) {
    try {
      const merchantJson = JSON.stringify(merchantData);
      
      return await this.runPythonScript('merchantCategorizer.py', merchantJson);
    } catch (error) {
      console.error('Merchant categorization error:', error);
      return {
        category: 'Discretionary',
        confidence: 0.1,
        matched_keywords: [],
        all_scores: {},
        reasoning: "Default categorization due to service error"
      };
    }
  }
}

module.exports = MLService;