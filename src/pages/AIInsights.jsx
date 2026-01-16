import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  Brain,
  RefreshCw
} from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function AIInsights() {
  const [user, setUser] = useState(null);
  const [insights, setInsights] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();
  }, []);

  const { data: trades = [] } = useQuery({
    queryKey: ['myTrades', user?.email],
    queryFn: () => base44.entities.Trade.filter({ created_by: user?.email }, '-entry_time'),
    enabled: !!user?.email,
  });

  const generateInsights = async () => {
    if (!user) {
      setInsights({
        error: true,
        message: 'Please wait while we load your account...'
      });
      return;
    }

    if (trades.length < 5) {
      setInsights({
        error: true,
        message: 'You need at least 5 trades to generate AI insights. Keep trading and come back!'
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Prepare trade summary for AI
      const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const wins = trades.filter(t => t.result === 'Win').length;
      const losses = trades.filter(t => t.result === 'Loss').length;
      const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

      // Setup performance
      const setupStats = trades.reduce((acc, t) => {
        (t.setup || []).forEach(setup => {
          if (!acc[setup]) acc[setup] = { wins: 0, losses: 0, total: 0, pnl: 0 };
          acc[setup].total++;
          acc[setup].pnl += t.pnl || 0;
          if (t.result === 'Win') acc[setup].wins++;
          if (t.result === 'Loss') acc[setup].losses++;
        });
        return acc;
      }, {});

      // Session performance
      const sessionStats = trades.reduce((acc, t) => {
        if (t.session) {
          if (!acc[t.session]) acc[t.session] = { wins: 0, losses: 0, total: 0, pnl: 0 };
          acc[t.session].total++;
          acc[t.session].pnl += t.pnl || 0;
          if (t.result === 'Win') acc[t.session].wins++;
          if (t.result === 'Loss') acc[t.session].losses++;
        }
        return acc;
      }, {});

      const avgWin = wins > 0 ? trades.filter(t => t.result === 'Win').reduce((sum, t) => sum + (t.pnl || 0), 0) / wins : 0;
      const avgLoss = losses > 0 ? Math.abs(trades.filter(t => t.result === 'Loss').reduce((sum, t) => sum + (t.pnl || 0), 0) / losses) : 0;

      const tradeSummary = {
        totalTrades: trades.length,
        totalPnL,
        winRate: winRate.toFixed(1),
        avgWin: avgWin.toFixed(2),
        avgLoss: avgLoss.toFixed(2),
        setupPerformance: Object.entries(setupStats).map(([setup, data]) => ({
          setup,
          winRate: data.total > 0 ? ((data.wins / data.total) * 100).toFixed(1) : 0,
          trades: data.total,
          pnl: data.pnl.toFixed(2)
        })),
        sessionPerformance: Object.entries(sessionStats).map(([session, data]) => ({
          session,
          winRate: data.total > 0 ? ((data.wins / data.total) * 100).toFixed(1) : 0,
          trades: data.total,
          pnl: data.pnl.toFixed(2)
        })),
        recentTrades: trades.slice(0, 10).map(t => ({
          symbol: t.symbol,
          result: t.result,
          pnl: t.pnl,
          setup: t.setup,
          session: t.session,
          notes: t.notes
        }))
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert trading coach analyzing a trader's performance. Based on the following trading data, provide actionable insights and recommendations.

Trading Summary:
${JSON.stringify(tradeSummary, null, 2)}

IMPORTANT: Pay close attention to the trader's notes in the recent trades. These notes contain their thought process, mistakes, and observations. Analyze these notes to understand patterns in their decision-making and emotional state.

Please analyze this data and provide:
1. 3-4 key strengths the trader has demonstrated (include insights from their notes)
2. 3-4 areas that need improvement (reference specific issues mentioned in notes)
3. 3-4 specific, actionable recommendations to improve performance (based on both data and notes)
4. Best performing setup and session
5. Worst performing setup and session
6. An overall assessment of their trading (1-2 sentences)

Be specific and use the actual data provided, including patterns you notice in their trade notes. Focus on practical advice.`,
        response_json_schema: {
          type: 'object',
          properties: {
            strengths: {
              type: 'array',
              items: { type: 'string' }
            },
            improvements: {
              type: 'array',
              items: { type: 'string' }
            },
            recommendations: {
              type: 'array',
              items: { type: 'string' }
            },
            bestSetup: { type: 'string' },
            worstSetup: { type: 'string' },
            bestSession: { type: 'string' },
            worstSession: { type: 'string' },
            overallAssessment: { type: 'string' }
          }
        }
      });

      setInsights(response);
    } catch (err) {
      console.error('Failed to generate insights:', err);
      setInsights({
        error: true,
        message: 'Failed to generate insights. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/20">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">AI Insights</h1>
            <p className="text-gray-400">Get personalized trading analysis and recommendations</p>
          </div>
        </div>
        <Button 
          onClick={generateInsights}
          disabled={isGenerating}
          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Generate Insights
            </>
          )}
        </Button>
      </div>

      {/* No trades message */}
      {!insights && !isGenerating && (
        <div className="text-center py-20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50">
          <Sparkles className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">AI-Powered Trading Insights</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Click "Generate Insights" to get personalized analysis of your trading performance, 
            identify patterns, and receive actionable recommendations.
          </p>
          <Button 
            onClick={generateInsights}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-500 to-pink-600"
          >
            <Brain className="w-4 h-4 mr-2" />
            Generate Insights
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isGenerating && (
        <div className="text-center py-20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
            <Brain className="absolute inset-0 m-auto w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-300">Analyzing your trading data...</h3>
          <p className="text-gray-500 mt-2">This may take a few seconds</p>
        </div>
      )}

      {/* Error state */}
      {insights?.error && (
        <div className="text-center py-12 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-red-500/30">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">Unable to Generate Insights</h3>
          <p className="text-gray-400">{insights.message}</p>
        </div>
      )}

      {/* Insights display */}
      {insights && !insights.error && (
        <div className="space-y-6">
          {/* Overall Assessment */}
          <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl border border-purple-500/30 p-6">
            <div className="flex items-start gap-3">
              <Target className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Overall Assessment</h3>
                <p className="text-gray-300">{insights.overallAssessment}</p>
              </div>
            </div>
          </div>

          {/* Best & Worst */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 rounded-2xl border border-emerald-500/30 p-6">
              <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Best Performers
              </h3>
              <div className="space-y-3">
                <div className="bg-emerald-500/10 p-3 rounded-lg">
                  <div className="text-xs text-emerald-300/70 mb-1">Best Setup</div>
                  <div className="text-white font-semibold">{insights.bestSetup}</div>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-lg">
                  <div className="text-xs text-emerald-300/70 mb-1">Best Session</div>
                  <div className="text-white font-semibold">{insights.bestSession}</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-2xl border border-red-500/30 p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Needs Attention
              </h3>
              <div className="space-y-3">
                <div className="bg-red-500/10 p-3 rounded-lg">
                  <div className="text-xs text-red-300/70 mb-1">Weakest Setup</div>
                  <div className="text-white font-semibold">{insights.worstSetup}</div>
                </div>
                <div className="bg-red-500/10 p-3 rounded-lg">
                  <div className="text-xs text-red-300/70 mb-1">Weakest Session</div>
                  <div className="text-white font-semibold">{insights.worstSession}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Strengths */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Your Strengths
            </h3>
            <div className="space-y-3">
              {insights.strengths?.map((strength, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Areas for Improvement
            </h3>
            <div className="space-y-3">
              {insights.improvements?.map((improvement, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{improvement}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-cyan-400" />
              Actionable Recommendations
            </h3>
            <div className="space-y-3">
              {insights.recommendations?.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-cyan-400">{index + 1}</span>
                  </div>
                  <span className="text-gray-300">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}