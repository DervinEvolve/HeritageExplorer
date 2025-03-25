import { ResearchTimeline } from "@/components/ResearchTimeline";
import { PerplexityChat } from "@/components/PerplexityChat";
import { TranslationTool } from "@/components/TranslationTool";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

export function Research() {
  return (
    <div className="space-y-8">
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold">Research Tools</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Access advanced research tools and collaborate with experts to explore cultural heritage.
        </p>
      </motion.section>

      <Tabs defaultValue="timeline">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Historical Timeline</TabsTrigger>
          <TabsTrigger value="assistant">Research Assistant</TabsTrigger>
          <TabsTrigger value="translation">Translation</TabsTrigger>
        </TabsList>
        <AnimatePresence mode="sync" initial={false}>
          <TabsContent value="timeline" key="timeline">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <ResearchTimeline />
            </motion.div>
          </TabsContent>
          <TabsContent value="assistant" key="assistant">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PerplexityChat />
            </motion.div>
          </TabsContent>
          <TabsContent value="translation" key="translation">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TranslationTool />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}