"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Lightbulb, RefreshCw, Loader2, ChevronDown, ChevronUp, TrendingUp, ScrollText, CheckCircle } from "lucide-react"
import { getDashboardInsights } from "@/lib/actions/ai-insights"

interface AIInsightsPanelProps {
  metrics: any
  selectedMedicines: number[]
  conditionData?: any
  topReceivedItems?: any
  topDispensedItems?: any
  topItemsByQuantity?: any
  isLoading?: boolean
}

export function AIInsightsPanel({
  metrics,
  selectedMedicines,
  conditionData,
  topReceivedItems,
  topDispensedItems,
  topItemsByQuantity,
  isLoading: externalLoading
}: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<{
    summary: string;
    keyPoints: string[];
    recommendations: string[];
    trends: string[];
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  // Generate insights when data changes or component mounts
  useEffect(() => {
    if (!externalLoading && metrics) {
      generateInsights()
    }
  }, [metrics, selectedMedicines])

  async function generateInsights() {
    setIsLoading(true)
    setError(null)
    
    try {
      const analysisData = {
        metrics,
        selectedMedicines,
        conditionData,
        topReceivedItems,
        topDispensedItems,
        topItemsByQuantity
      }
      
      const response = await getDashboardInsights(analysisData)
      
      if (response.success && response.data) {
        setInsights(response.data)
        setLastRefreshed(new Date())
      } else {
        setError(response.error || "Failed to generate insights")
      }
    } catch (error) {
      console.error("Error generating insights:", error)
      setError("An error occurred while generating insights")
    } finally {
      setIsLoading(false)
    }
  }

  function formatLastRefreshed() {
    if (!lastRefreshed) return "";
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(lastRefreshed);
  }

  return (
    <Card className="border-2 border-blue-50 shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-white pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 mr-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
            <CardTitle className="text-lg flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-blue-600" />
              Executive Insights
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {lastRefreshed && (
              <CardDescription className="text-xs">
                Last updated: {formatLastRefreshed()}
              </CardDescription>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={generateInsights} 
              disabled={isLoading}
              className="h-8 px-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">Analyzing inventory data...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 rounded-md text-red-800 text-sm">
              {error}
            </div>
          ) : insights ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {insights.summary && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                      <ScrollText className="h-4 w-4 mr-1" /> EXECUTIVE SUMMARY
                    </h3>
                    <p className="text-sm">{insights.summary}</p>
                  </div>
                )}
                
                <Separator />
                
                {insights.keyPoints.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 mr-1" /> KEY OBSERVATIONS
                    </h3>
                    <ul className="space-y-2">
                      {insights.keyPoints.map((point, index) => {
                        // Split by colon to separate title from content
                        const parts = point.split(':');
                        if (parts.length > 1) {
                          return (
                            <li key={`point-${index}`} className="text-sm flex">
                              <span className="text-blue-600 mr-2">•</span>
                              <span>
                                <span className="font-bold  px-1">{parts[0]}:</span>
                                {parts.slice(1).join(':')}
                              </span>
                            </li>
                          );
                        } else {
                          return (
                            <li key={`point-${index}`} className="text-sm flex">
                              <span className="text-blue-600 mr-2">•</span>
                              <span>{point}</span>
                            </li>
                          );
                        }
                      })}
                    </ul>
                  </div>
                )}
                
                <Separator />
                
                {insights.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                      <Lightbulb className="h-4 w-4 mr-1" /> STRATEGIC RECOMMENDATIONS
                    </h3>
                    <ul className="space-y-2">
                      {insights.recommendations.map((rec, index) => {
                        // Split by colon to separate title from content
                        const parts = rec.split(':');
                        if (parts.length > 1) {
                          return (
                            <li key={`rec-${index}`} className="text-sm flex">
                              <span className="text-blue-600 mr-2">•</span>
                              <span>
                                <span className="font-bold px-1">{parts[0]}:</span>
                                {parts.slice(1).join(':')}
                              </span>
                            </li>
                          );
                        } else {
                          return (
                            <li key={`rec-${index}`} className="text-sm flex">
                              <span className="text-blue-600 mr-2">•</span>
                              <span>{rec}</span>
                            </li>
                          );
                        }
                      })}
                    </ul>
                  </div>
                )}
                
                <Separator />
                
                {insights.trends.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-2">
                      <TrendingUp className="h-4 w-4 mr-1" /> TREND ANALYSIS
                    </h3>
                    <ul className="space-y-2">
                      {insights.trends.map((trend, index) => {
                        // Split by colon to separate title from content
                        const parts = trend.split(':');
                        if (parts.length > 1) {
                          return (
                            <li key={`trend-${index}`} className="text-sm flex">
                              <span className="text-blue-600 mr-2">•</span>
                              <span>
                                <span className="font-bold px-1">{parts[0]}:</span>
                                {parts.slice(1).join(':')}
                              </span>
                            </li>
                          );
                        } else {
                          return (
                            <li key={`trend-${index}`} className="text-sm flex">
                              <span className="text-blue-600 mr-2">•</span>
                              <span>{trend}</span>
                            </li>
                          );
                        }
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-center text-muted-foreground">
                Click refresh to generate insights about your inventory data.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}